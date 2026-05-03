"""
Aircraft Data Bus Simulator
============================
Simulates sensor readings for a Boeing 737 MAX and inserts them into
the Raw_Bus_Telemetry table at each sensor's designated update rate.

Requirements:
    pip install mysql-connector-python

Usage:
    python aircraft_bus_simulator.py [--host HOST] [--port PORT]
                                     [--user USER] [--password PASSWORD]
                                     [--database DATABASE]
                                     [--duration SECONDS]
"""

import argparse
import logging
import math
import random
import signal
import sys
import time
from datetime import datetime
from threading import Event, Thread

import mysql.connector
from mysql.connector import Error

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Sensor catalogue  (mirrors 737MAX_DB.Aircraft_Sensors)
# ---------------------------------------------------------------------------
# Each entry:
#   sid           – Sensor_ID (FK into Aircraft_Sensors)
#   name          – human-readable label (for logging only)
#   update_rate   – Hz  → interval = 1 / update_rate  seconds
#   reading_fn    – callable() → float  (physical unit simulation)
#   status_fn     – callable() → bool   (True = healthy, False = fault)
# ---------------------------------------------------------------------------

def _gaussian(mu, sigma):
    """Return a lambda that produces normally-distributed readings."""
    return lambda: random.gauss(mu, sigma)


def _bounded(fn, lo, hi):
    """Clamp a reading-generating function to [lo, hi]."""
    return lambda: max(lo, min(hi, fn()))


def _status(fault_prob=0.002):
    """Return 1 (healthy) with high probability, 0 (fault) rarely."""
    return lambda: 0 if random.random() < fault_prob else 1


# Simulated physical ranges / nominal values
# Pitot pressure (Pa): cruise ~24 000 Pa dynamic pressure, ±noise
_pitot   = _bounded(_gaussian(24_000, 120),  20_000, 30_000)
# Static port (Pa): FL350 ~23 842 Pa, ±noise
_static  = _bounded(_gaussian(23_842,  80),  20_000, 28_000)
# TAT (°C): cruise ~−45 °C ± noise
_tat     = _bounded(_gaussian(-45, 0.5),     -80,    60)
# Fuel quantity (kg): half-full 737, left ≈ right ≈ 5 000 kg
_fuel_l  = _bounded(_gaussian(5_000,  2),    0,     10_000)
_fuel_r  = _bounded(_gaussian(5_000,  2),    0,     10_000)
# Fuel flow (kg/h): ~2 500 kg/h per engine at cruise
_ff_e1   = _bounded(_gaussian(2_500, 10),    0,      5_000)
_ff_e2   = _bounded(_gaussian(2_500, 10),    0,      5_000)
# Oil pressure (psi): ~55 psi nominal
_op_e1   = _bounded(_gaussian(55, 0.3),      20,    100)
_op_e2   = _bounded(_gaussian(55, 0.3),      20,    100)
# Oil temperature (°C): ~85 °C nominal
_ot_e1   = _bounded(_gaussian(85, 0.5),       0,    160)
_ot_e2   = _bounded(_gaussian(85, 0.5),       0,    160)
# EGT (°C): ~650 °C at cruise
_egt_e1  = _bounded(_gaussian(650, 2),       400,   1_050)
_egt_e2  = _bounded(_gaussian(650, 2),       400,   1_050)

SENSORS = [
    # ── Air Data ──────────────────────────────────────────────────────────
    {"sid": 2,  "name": "FO Pitot Probe",                "update_rate": 50,  "reading_fn": _pitot,   "status_fn": _status()},
    {"sid": 3,  "name": "Aux Pitot Probe",               "update_rate": 50,  "reading_fn": _pitot,   "status_fn": _status()},
    {"sid": 4,  "name": "Capt Static Port Set",          "update_rate": 25,  "reading_fn": _static,  "status_fn": _status()},
    {"sid": 5,  "name": "FO Static Port Set",            "update_rate": 25,  "reading_fn": _static,  "status_fn": _status()},
    {"sid": 6,  "name": "Standby Static Port Set",       "update_rate": 25,  "reading_fn": _static,  "status_fn": _status()},
    {"sid": 7,  "name": "Total Air Temperature (TAT)",   "update_rate": 10,  "reading_fn": _tat,     "status_fn": _status()},
    # ── Fuel Management ───────────────────────────────────────────────────
    {"sid": 8,  "name": "Fuel Quantity Probe - Left",    "update_rate":  1,  "reading_fn": _fuel_l,  "status_fn": _status()},
    {"sid": 9,  "name": "Fuel Quantity Probe - Right",   "update_rate":  1,  "reading_fn": _fuel_r,  "status_fn": _status()},
    {"sid": 10, "name": "Fuel Flow Transmitter - Eng 1", "update_rate":  5,  "reading_fn": _ff_e1,   "status_fn": _status()},
    {"sid": 11, "name": "Fuel Flow Transmitter - Eng 2", "update_rate":  5,  "reading_fn": _ff_e2,   "status_fn": _status()},
    # ── Engine Monitoring ─────────────────────────────────────────────────
    {"sid": 12, "name": "Oil Pressure Sensor - Eng 1",  "update_rate": 10,  "reading_fn": _op_e1,   "status_fn": _status()},
    {"sid": 13, "name": "Oil Pressure Sensor - Eng 2",  "update_rate": 10,  "reading_fn": _op_e2,   "status_fn": _status()},
    {"sid": 14, "name": "Oil Temp Sensor - Eng 1",      "update_rate":  2,  "reading_fn": _ot_e1,   "status_fn": _status()},
    {"sid": 15, "name": "Oil Temp Sensor - Eng 2",      "update_rate":  2,  "reading_fn": _ot_e2,   "status_fn": _status()},
    {"sid": 16, "name": "EGT Thermocouple - Eng 1",     "update_rate": 20,  "reading_fn": _egt_e1,  "status_fn": _status()},
    {"sid": 17, "name": "EGT Thermocouple - Eng 2",     "update_rate": 20,  "reading_fn": _egt_e2,  "status_fn": _status()},
]

# ---------------------------------------------------------------------------
# DDL (run once to guarantee the table exists)
# ---------------------------------------------------------------------------
CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS `Raw_Bus_Telemetry` (
    `Record_ID`   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `Timestamp`   DATETIME(3),
    `Sensor_ID`   INTEGER,
    `Raw_Reading` FLOAT,
    `Status`      BIT(1),
    PRIMARY KEY (`Record_ID`),
    INDEX `idx_sensor_ts` (`Sensor_ID`, `Timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
"""

INSERT_SQL = """
INSERT INTO `Raw_Bus_Telemetry`
    (`Timestamp`, `Sensor_ID`, `Raw_Reading`, `Status`)
VALUES
    (%s, %s, %s, %s)
"""

# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def get_connection(host, port, user, password, database):
    return mysql.connector.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
        autocommit=True,
        connection_timeout=10,
    )


def ensure_table(conn):
    with conn.cursor() as cur:
        cur.execute(CREATE_TABLE_SQL)
    log.info("Raw_Bus_Telemetry table ready.")


# ---------------------------------------------------------------------------
# Per-sensor worker thread
# ---------------------------------------------------------------------------

class SensorThread(Thread):
    """
    Fires at a fixed interval (1 / update_rate seconds), generates a
    simulated reading and inserts it into Raw_Bus_Telemetry.
    """

    def __init__(self, sensor: dict, conn_factory, stop_event: Event):
        super().__init__(name=f"Sensor-{sensor['sid']}", daemon=True)
        self.sensor       = sensor
        self.conn_factory = conn_factory
        self.stop_event   = stop_event
        self.interval     = 1.0 / sensor["update_rate"]  # seconds

    # ------------------------------------------------------------------
    def run(self):
        sid      = self.sensor["sid"]
        name     = self.sensor["name"]
        read_fn  = self.sensor["reading_fn"]
        stat_fn  = self.sensor["status_fn"]

        log.info(
            "Starting sensor SID=%d (%s) @ %g Hz (interval %.4f s)",
            sid, name, self.sensor["update_rate"], self.interval,
        )

        try:
            conn = self.conn_factory()
            cursor = conn.cursor()
        except Error as exc:
            log.error("SID=%d: cannot connect to DB: %s", sid, exc)
            return

        try:
            next_tick = time.perf_counter()

            while not self.stop_event.is_set():
                now        = datetime.utcnow()
                raw_value  = read_fn()
                status_bit = stat_fn()

                try:
                    cursor.execute(INSERT_SQL, (now, sid, raw_value, status_bit))
                except Error as exc:
                    log.warning("SID=%d insert error: %s – reconnecting…", sid, exc)
                    try:
                        conn.reconnect(attempts=3, delay=1)
                        cursor = conn.cursor()
                        cursor.execute(INSERT_SQL, (now, sid, raw_value, status_bit))
                    except Error as exc2:
                        log.error("SID=%d reconnect failed: %s", sid, exc2)

                # High-resolution sleep: sleep until next scheduled tick
                next_tick += self.interval
                sleep_for = next_tick - time.perf_counter()
                if sleep_for > 0:
                    self.stop_event.wait(timeout=sleep_for)

        finally:
            try:
                cursor.close()
                conn.close()
            except Exception:
                pass
            log.info("Sensor SID=%d stopped.", sid)


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Boeing 737 MAX aircraft data bus simulator"
    )
    parser.add_argument("--host",     default="127.0.0.1", help="MySQL host")
    parser.add_argument("--port",     default=3306,  type=int, help="MySQL port")
    parser.add_argument("--user",     default="root",  help="MySQL user")
    parser.add_argument("--password", default="",     help="MySQL password")
    parser.add_argument("--database", default="737MAX_DB", help="Target database")
    parser.add_argument(
        "--duration", default=0, type=float,
        help="Run for N seconds then stop (0 = run until Ctrl-C)",
    )
    args = parser.parse_args()

    # Verify we can reach the database before spawning threads
    try:
        admin_conn = get_connection(
            args.host, args.port, args.user, args.password, args.database
        )
        ensure_table(admin_conn)
        admin_conn.close()
    except Error as exc:
        log.critical("Cannot connect to database: %s", exc)
        sys.exit(1)

    # Factory so each thread gets its own connection
    def conn_factory():
        return get_connection(
            args.host, args.port, args.user, args.password, args.database
        )

    stop_event = Event()

    # Graceful shutdown on SIGINT / SIGTERM
    def _shutdown(signum, frame):
        log.info("Shutdown signal received – stopping all sensors…")
        stop_event.set()

    signal.signal(signal.SIGINT,  _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)

    # Spawn one thread per sensor
    threads = [
        SensorThread(sensor, conn_factory, stop_event)
        for sensor in SENSORS
    ]
    for t in threads:
        t.start()

    log.info(
        "Simulation running: %d sensor threads active. "
        "Press Ctrl-C to stop%s.",
        len(threads),
        f" (auto-stop in {args.duration}s)" if args.duration else "",
    )

    if args.duration > 0:
        stop_event.wait(timeout=args.duration)
        stop_event.set()
    else:
        # Block main thread until signal
        while not stop_event.is_set():
            time.sleep(0.5)

    for t in threads:
        t.join(timeout=5)

    log.info("All sensor threads stopped. Simulation complete.")


if __name__ == "__main__":
    main()