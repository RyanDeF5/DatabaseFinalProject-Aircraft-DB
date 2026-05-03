const mysql = require('mysql2/promise'); // Use the promise-based API

async function main() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: "100.98.207.5",
      user: "admin",
      password: "Waronline12345#",
      database: "737MAX_DB"
    });
    console.log("Connected to database");
    
    // Example usage:
    const [rows] = await connection.query('SELECT * FROM Aircraft_Sensors');
    console.log(rows[10].Name);
    // console.table(rows);


  } catch (error) {
    console.error("Error connecting to the database:", error);
  } finally {
    if (connection) {
      await connection.end();
      console.log("Connection closed");
    }
  }
}

main();