import { Roboto_Mono } from "next/font/google";
import { useState, useEffect } from "react";
import Image from "next/image";
import logo from "@/public/FMC_Logo.png";
import AddRowPopup from "./popupAdd";
import DeleteRowPopup from "./popupDelete";

const robotoMono = Roboto_Mono({ subsets: ["latin"], weight: ["400", "700"] });

export function MainPage() {
  const [fetchType, setFetchType] = useState("");
  const [stateData, setStateData] = useState<Record<string, any>[]>([]);
  const [identityData, setIdentityData] = useState<Record<string, any>[]>([]);
  const [faultLogData, setFaultLogData] = useState<Record<string, any>[]>([]);
  const [navData, setNavData] = useState<Record<string, any>[]>([]);
  const [faultReport, setFaultReport] = useState<Record<string, any>[]>([]);
  const [navReport, setNavReport] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Starting...");
  const [activeScreen, setActiveScreen] = useState("loading");
  const [activePopup, setActivePopup] = useState(""); // setActivePopup("addNav")
  const [showLogo, setShowLogo] = useState(false);
  const [TTF, setTTF] = useState(0);
  const [userValue, setUserValue] = useState("");
  const [username, setUsername] = useState("Unknown");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const login = async () => {
      try {
        let response = await fetch(
          `http://localhost:8000/login?username=admin&password=Waronline12345%23`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          },
        );
      } catch (error) {
        console.error("Login error:", error);
      }
    };
    login();
  }, []);

  const handleLogin = async () => {
    const start = performance.now();
    try {
      let response = await fetch(
        `http://localhost:8000/login?username=${username}&password=${password}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      const result = await response.json();
      const end = performance.now();
      setTTF(Math.round(end - start));
      setFetchType("POST");
      if (!response.ok) {
        alert("Authentication failed");
      } else {
        setActiveScreen("main");
      }
    } catch (error) {
      alert(`Error occurred during login, please try again later`);
    } finally {
      setLoading(false);
    }
  };

  const handleOkDelAFP = async (row_id: any) => {
    console.log("Received Data: ", row_id);

    const start = performance.now();
    try {
      let response = await fetch(
        `http://localhost:8000/table/Active_Flight_Plan/DeleteRow/${row_id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      const result = await response.json();
      setNavData(result.payload);
      const end = performance.now();
      setTTF(Math.round(end - start));
      setFetchType("POST");
      if (!response.ok) {
        alert("Server failed to respond.");
      }
    } catch (error) {
      alert(`Error occurred during update:`);
    } finally {
      setLoading(false);
      setActivePopup("");
    }
  };
  const handleOkAddAFP = async (data: Record<string, string>) => {
    console.log("Received Data: ", data);

    const start = performance.now();
    try {
      let response = await fetch(
        "http://localhost:8000/table/Active_Flight_Plan/InsertRow",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Leg_ID: data.field0,
            Waypoint_ID: data.field1,
            Target_Altitude: data.field2,
            Target_Speed: data.field3,
            Leg_Type: data.field4,
            Status: data.field5,
          }),
        },
      );
      const result = await response.json();
      setNavData(result.payload);
      const end = performance.now();
      setTTF(Math.round(end - start));
      setFetchType("POST");
      if (!response.ok) {
        alert("Server failed to respond.");
      }
    } catch (error) {
      alert(`Error occurred during update:`);
    } finally {
      setLoading(false);
      setActivePopup("");
    }
  };

  async function handleLineSelectFaultLogs(
    rowIndex: number,
    primaryKey: string,
    fieldName: string,
  ) {
    if (!userValue) return;
    setLoading(true);
    faultLogData.map((row, i) =>
      i === rowIndex ? { ...row, [fieldName]: userValue } : row,
    );
    const start = performance.now();
    try {
      let response = await fetch(
        "http://localhost:8000/table/Active_Maintenance_Faults/update",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pk: primaryKey,
            rowIndex: rowIndex,
            columnName: fieldName,
            value: userValue,
          }),
        },
      );
      let result = await response.json();
      setFaultLogData(result.payload);
      const end = performance.now();
      setTTF(Math.round(end - start));
      setFetchType("POST");
      if (!response.ok) {
        alert("Server failed to respond.");
      }
    } catch (error) {
      alert(`Error occurred during update:`);
    } finally {
      setLoading(false);
      setUserValue("");
    }
  }

  async function handleLineSelectNavTable(
    rowIndex: number,
    primaryKey: string,
    fieldName: string,
  ) {
    if (!userValue) return;
    setLoading(true);
    navData.map((row, i) =>
      i === rowIndex ? { ...row, [fieldName]: userValue } : row,
    );
    const start = performance.now();
    try {
      let response = await fetch(
        "http://localhost:8000/table/Active_Flight_Plan/update",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pk: primaryKey,
            rowIndex: rowIndex,
            columnName: fieldName,
            value: userValue,
          }),
        },
      );
      let result = await response.json();
      setNavData(result.payload);
      const end = performance.now();
      setTTF(Math.round(end - start));
      setFetchType("POST");
      if (!response.ok) {
        alert("Server failed to respond.");
      }
    } catch (error) {
      alert(`Error occurred during update:`);
    } finally {
      setLoading(false);
      setUserValue("");
    }
  }
  // #endregion

  async function refreshState() {
    setShowLogo(true);
    setTimeout(async () => {
      try {
        setLoading(true);
        const start = performance.now();
        // State Vector fetch
        setLoadingMessage("Loging...");
        setLoadingMessage(
          "Fetching State Vector: http://localhost:8000/statevector",
        );
        let response = await fetch("http://localhost:8000/statevector", {
          cache: "no-store",
        });
        setLoadingMessage("Loading data...");
        let result = await response.json();
        setStateData(result.payload);
        setLoadingMessage("Fetching Aircraft Identity...");
        // Aircraft Identity fetch
        response = await fetch(
          "http://localhost:8000/table/Aircraft_Identity",
          { cache: "no-store" },
        );
        setLoadingMessage("Loading data...");
        result = await response.json();
        setIdentityData(result.payload);

        setLoadingMessage("Fetching Aircraft Faults...");
        response = await fetch(
          "http://localhost:8000/table/Active_Maintenance_Faults",
          { cache: "no-store" },
        );
        setLoadingMessage("Loading data...");
        result = await response.json();
        setFaultLogData(result.payload);

        setLoadingMessage("Fetching Aircraft Fight Plan Data...");
        response = await fetch(
          "http://localhost:8000/table/Active_Flight_Plan",
          { cache: "no-store" },
        );
        setLoadingMessage("Loading data...");
        result = await response.json();
        setNavData(result.payload);

        setLoadingMessage("Fetching Fault Information...");
        response = await fetch(
          "http://localhost:8000/faults",
          { cache: "no-store" },
        );
        setLoadingMessage("Loading data...");
        result = await response.json();
        setFaultReport(result.payload);

        // NEW!
        setLoadingMessage("Fetching Nav State Information...");
        response = await fetch(
          "http://localhost:8000/navstate",
          { cache: "no-store" },
        );
        setLoadingMessage("Loading data...");
        result = await response.json();
        setNavReport(result.payload);

        console.log(result);

        setLoadingMessage("Finishing Up...");
        const end = performance.now();
        setTTF(Math.round(end - start));
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        if (activeScreen === "loading") {
          setTimeout(() => {
            setActiveScreen("login");
            setLoadingMessage("");
          }, 500);
        }
        setLoading(false);
        setFetchType("GET");
      }
    }, 250);
  }

  const buttonStyle =
    " bg-neutral-800 text-neutral-200 rounded-md border border-neutral-700 shadow-[inset_0_2px_2px_rgba(255,255,255,0.08),inset_0_-2px_3px_rgba(0,0,0,0.8),0_1px_2px_rgba(0,0,0,0.6)] active:shadow-[inset_0_3px_5px_rgba(0,0,0,0.9)] active:translate-y-[1px] font-mono text-sm w-50 h-10 flex items-center justify-center transition-all duration-75 text-[20px]";
  const rowButtonClass =
    "text-[20px] disabled:opacity-50 disabled:cursor-not-allowed";
  const lengthOfScreen = 125;

  useEffect(() => {
    refreshState();
  }, []);

  return (
    // Main Screen
    <>
      <div
        className={`bg-black text-white m-auto w-225 h-250 ${robotoMono.className}`}
      >
        <div className="text-center text-[30px]">
          <h1 className="font-bold">{activeScreen.toUpperCase()}</h1>
        </div>
        <div className="relative flex flex-auto text-center font-bold text-[23px]">
          {activeScreen !== "login" && (
            <div className="absolute left-30 bottom-1 text-center font-bold text-[23px]">
              {username}
            </div>
          )}
          <div className="absolute left-160 bottom-1">
            {loading ? (
              <div>Fetching...</div>
            ) : (
              <div className="flex gap-2 justify-center">
                {" "}
                {fetchType}:{" "}
                <span
                  className={TTF < 500 ? "text-green-500" : "text-orange-400"}
                >
                  {TTF}ms
                </span>
              </div>
            )}
          </div>
        </div>
        <div
          className={`opacity-100 w-full h-${lengthOfScreen} text-center items-center`}
        >
          {/* ======== LOADING PAGE ======== */}
          {activeScreen === "loading" && (
            <div
              className={`w-full h-${lengthOfScreen} text-center justify-items-center items-center`}
            >
              <Image
                src={logo}
                alt="FMC Logo"
                width={500}
                className={`transition-opacity duration-100 ${showLogo ? "opacity-100" : "opacity-0"}`}
              />
              <div
                className={`text-[22px] font-bold transition-opacity duration-100 ${showLogo ? "opacity-100" : "opacity-0"}`}
              >
                {loadingMessage}
              </div>
            </div>
          )}
          {/* ======== MAIN PAGE ======== */}
          {activeScreen === "main" && (
            <div
              className={`opacity-100 grid grid-cols-auto grid-rows-auto w-full h-130 text-center items-center`}
            >
              <div className="col-span-2 row-span-1 text-[30px]">
                <h1 className="ml-10 text-left font-bold">{`${identityData[0]?.Manufacturer} ${identityData[0]?.Model_Series}`}</h1>
              </div>
              {stateData &&
                stateData.map((row: Record<string, any>) => (
                  <>
                    <div
                      className={`opacity-100 pl-10 col-start-1 text-left text-[28px]`}
                    >
                      {row.Parameter_ID}
                    </div>
                    <div
                      className={`opacity-100 pr-10 col-start-2 row-start-${row.SVID + 1} text-right text-[35px]`}
                    >
                      {row.Value == null ? "---" : row.Value} {row.Unit}
                    </div>
                  </>
                ))}
            </div>
          )}{" "}
          {/* ======== LOGS PAGE ======== */}
          {activeScreen === "logs" && (
            <div
              className={`opacity-100 grid grid-rows-12 w-full h-130 text-center items-center border-b-2 border-white`}
            >
              <div className="ml-10 text-center font-bold col-span-4 text-[25px]">
                Fault Logs:
              </div>
              <div>Log_ID</div>
              <div>Timestamp</div>
              <div>Record_ID</div>
              <div>Fault_Code</div>
              {faultLogData &&
                faultLogData.map((row: Record<string, any>) => (
                  <>
                    <button
                      disabled={loading}
                      onClick={() =>
                        handleLineSelectFaultLogs(
                          row.Log_ID,
                          "Log_ID",
                          "Log_ID",
                        )
                      }
                      className={`${rowButtonClass} pl-10 col-start-1 text-left`}
                    >
                      {row.Log_ID}
                    </button>
                    <button
                      disabled={loading}
                      onClick={() =>
                        handleLineSelectFaultLogs(
                          row.Log_ID,
                          "Log_ID",
                          "Timestamp",
                        )
                      }
                      className={`${rowButtonClass} col-start-2`}
                    >
                      {row.Timestamp}
                    </button>
                    <button
                      disabled={loading}
                      onClick={() =>
                        handleLineSelectFaultLogs(
                          row.Log_ID,
                          "Log_ID",
                          "Record_ID",
                        )
                      }
                      className={`${rowButtonClass} pl-10 col-start-3 text-left`}
                    >
                      {row.Record_ID}
                    </button>
                    <button
                      disabled={loading}
                      onClick={() =>
                        handleLineSelectFaultLogs(
                          row.Log_ID,
                          "Log_ID",
                          "Fault_Code",
                        )
                      }
                      className={`${rowButtonClass} pl-10 col-start-4 text-left`}
                    >
                      {row.Fault_Code}
                    </button>
                  </>
                ))}
            </div>
          )}
          {/* ======== NAVIAGION PAGE ======== */}
          {activeScreen === "navigation" && (
            <div
              className={`opacity-100 grid grid-rows-12 w-full h-130 text-center items-center border-b-2 border-white`}
            >
              <div className="ml-10 text-center font-bold col-span-6 text-[25px]">
                Navigation Waypoints:
              </div>
              <div>Leg_ID</div>
              <div>Waypoint_ID</div>
              <div>Target_Altitude</div>
              <div>Target_Speed</div>
              <div>Leg_Type</div>
              <div>Status</div>
              {navData &&
                navData.map((row: Record<string, any>) => (
                  <>
                    <button
                      disabled={loading}
                      onClick={() =>
                        handleLineSelectNavTable(row.Leg_ID, "Leg_ID", "Leg_ID")
                      }
                      className={`pl-10 col-start-1 text-left text-[25px] disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {row.Leg_ID}
                    </button>
                    <button
                      disabled={loading}
                      onClick={() =>
                        handleLineSelectNavTable(
                          row.Leg_ID,
                          "Leg_ID",
                          "Waypoint_ID",
                        )
                      }
                      className={`col-start-2 text-left text-[25px] disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {row.Waypoint_ID}
                    </button>
                    <button
                      disabled={loading}
                      onClick={() =>
                        handleLineSelectNavTable(
                          row.Leg_ID,
                          "Leg_ID",
                          "Target_Altitude",
                        )
                      }
                      className={`pl-10 col-start-3 text-left text-[25px] disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {row.Target_Altitude}
                    </button>
                    <button
                      disabled={loading}
                      onClick={() =>
                        handleLineSelectNavTable(
                          row.Leg_ID,
                          "Leg_ID",
                          "Target_Speed",
                        )
                      }
                      className={`pl-10 col-start-4 text-left text-[25px] disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {row.Target_Speed}
                    </button>
                    <button
                      disabled={loading}
                      onClick={() =>
                        handleLineSelectNavTable(
                          row.Leg_ID,
                          "Leg_ID",
                          "Leg_Type",
                        )
                      }
                      className={`pl-10 col-start-5 text-left text-[25px] disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {row.Leg_Type}
                    </button>
                    <button
                      disabled={loading}
                      onClick={() =>
                        handleLineSelectNavTable(row.Leg_ID, "Leg_ID", "Status")
                      }
                      className={`pl-10 col-start-6 text-left text-[25px] disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {row.Status}
                    </button>
                  </>
                ))}
            </div>
          )}
          {/* ======== LOGIN PAGE ======== */}
          {activeScreen === "login" && (
            <div className="flex flex-col items-center justify-center w-full h-full min-h-[500px] border-b-2 border-white ">
              <h1 className="text-3xl font-bold mb-8 text-white">FMC Login</h1>
              <div className="w-full max-w-md p-6 bg-black">
                <div className="flex items-center mb-6">
                  <label className="text-xl mr-4 text-white whitespace-nowrap">
                    Username:
                  </label>
                  <input
                    className="flex-1 h-10 px-4 bg-transparent border border-white"
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="flex items-center mb-8">
                  <label className="text-xl mr-4 text-white whitespace-nowrap">
                    Password:
                  </label>
                  <input
                    className="flex-1 h-10 px-4 bg-transparent border border-white"
                    onChange={(e) => setPassword(e.target.value)}
                    // type="password"
                  />
                </div>
                <button
                  className="w-full h-10 bg-black border border-white text-white hover:bg-white hover:text-black "
                  onClick={handleLogin}
                >
                  Login
                </button>
              </div>
            </div>
          )}
          {activeScreen === "report_logs" && (
            <div
              className={`opacity-100 grid grid-rows-12 gap-3 w-full h-130 text-center items-center border-b-2 border-white`}
            >
              <div className="ml-10 text-center font-bold col-span-6 text-[25px]">
                Log Report:
              </div>
              <div>Fault_Code</div>
              <div>Category</div>
              <div>Sensor_To_Blame</div>
              <div>Hardware_PN</div>
              <div>Is Critical?</div>
              <div>Group</div>
              {faultReport &&
                faultReport.map((row: Record<string, any>) => (
                  <>
                    <button
                      disabled={loading}
                      className={`pl-10 col-start-1 text-left text-[18px] disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {row.Fault_Code}
                    </button>
                    <button
                      disabled={loading}
                      className={`col-start-2  text-left text-[18px] disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {row.Category}
                    </button>
                    <button
                      disabled={loading}
                      className={`pl-10 col-start-3  text-left text-[18px] disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {row.Name}
                    </button>
                    <button
                      disabled={loading}
                      className={`pl-10 col-start-4  text-left text-[18px] disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {row.Hardware_PN}
                    </button>
                    <button
                      disabled={loading}
                      className={`pl-10 col-start-5 text-left text-[18px] disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {(row.Is_Critical === 1) ? "Yes" : "No"}
                    </button>
                    <button
                      disabled={loading}
                      className={`pl-10 col-start-6  text-left text-[11px] disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {row.Redundancy_Group}
                    </button>
                  </>
                ))}
            </div>
          )}
          {activeScreen === "report_nav" && (
            <div
              className={`opacity-100 grid grid-rows-[30px_400px] grid-cols-2 gap-3 w-full h-130 text-center items-center border-b-2 border-white`}
            >
              <div className="ml-10 text-center col-span-2 font-bold text-[25px]">
                Flight Navigation Data:
              </div>
              <h1></h1>
              {navReport &&
              <>
                <div className="pl-15 col-start-1 col-end-2 row-start-2 row-end-2 text-left text-[27px]">
                  <div>{`Total Waypoints: ${(navReport[0].Amount + navReport[1].Amount + navReport[2].Amount)}`}</div>
                  <div>{`${navReport[0].Status}: ${navReport[0].Amount}`}</div>
                  <div>{`${navReport[1].Status}: ${navReport[1].Amount}`}</div>
                  <div>{`${navReport[2].Status}: ${navReport[2].Amount}`}</div>
                </div>
                <div className="pl-15 col-start-2 col-end-2 row-start-2 row-end-2 text-center text-[27px]">
                  <h1>Flight Completion:</h1>
                  <h1 className="text-[70px]">
                    {`${Math.round(navReport[0].Amount/(navReport[0].Amount + navReport[1].Amount + navReport[2].Amount)*100)}%`}</h1>
                </div>
              </>
                }
            </div>
          )}
        </div>
        {activePopup == "addNav" && (
          <AddRowPopup
            tableName="Flight Plan Table"
            numOfFields={6}
            onOk={handleOkAddAFP}
            onCancel={() => {
              setActivePopup("");
            }}
          />
        )}{" "}
        {activePopup == "delNav" && (
          <DeleteRowPopup
            tableName="Flight Plan Table"
            onOk={handleOkDelAFP}
            onCancel={() => {
              setActivePopup("");
            }}
          />
        )}
        <input
          className="mt-5 ml-1 w-full h-15 text-[30px] uppercase"
          onChange={(e) => setUserValue(e.target.value.toUpperCase())}
          value={userValue}
        />
        <div className="mt-5 grid grid-cols-4 gap-y-4 justify-items-center">
          <button className={buttonStyle} onClick={()=>{
            if (activeScreen !== "login")
              setActiveScreen("navigation");
          }}>
            View NAV
          </button>
          <button className={buttonStyle} onClick={refreshState}>
            Refresh Data
          </button>
          <button className={buttonStyle} onClick={()=>{
            if (activeScreen !== "login") 
              setActiveScreen("main");
          }}>
            Main Screen
          </button>
          <button className={buttonStyle} onClick={()=>{
            if (activeScreen !== "login") 
              setActiveScreen("logs");
          }}>
            View Fault Logs
          </button>

          <button className={buttonStyle} onClick={() => {
            if (activeScreen !== "login")  
              setActiveScreen("report_logs");
          }} >Report Logs</button>
          <button onClick={()=>{
            if (activeScreen !== "login")  
              setActiveScreen("report_nav");
          }} className={buttonStyle}>Report Nav</button>
          <button
            className={buttonStyle}
            onClick={() => {
              setActivePopup("");
              if (activeScreen === "navigation") setActivePopup("delNav");
              else if (activeScreen === "logs") setActivePopup("delLogs");
            }}
          >
            DELETE Row
          </button>
          <button
            className={buttonStyle}
            onClick={() => {
              setActivePopup("");
              if (activeScreen === "navigation") setActivePopup("addNav");
              else if (activeScreen === "logs") setActivePopup("addLogs");
            }}
          >
            ADD Row
          </button>
        </div>
      </div>
    </>
  );
}
