const express = require("express");
const path = require("path");

const app = express();

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Start the server
const PORT = 3000;

app.use(express.json());

app.listen(process.env.PORT || PORT, () => {
  console.log(
    `Server is running on http://localhost:${process.env.PORT || PORT}`
  );
});

const sqlite3 = require("sqlite3").verbose();

// Specify the database file path with .db extension
const dbPath = path.join(__dirname, "records.db");

// Create or open the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to the SQLite database:", dbPath);
  }
});

// Get last Monday's date
function getLastMonday() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - diff);

  // Format as YYYY-MM-DD in local time
  const year = lastMonday.getFullYear();
  const month = String(lastMonday.getMonth() + 1).padStart(2, "0");
  const day = String(lastMonday.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const lastMonday = new Date(getLastMonday());
lastMonday.setDate(lastMonday.getDate() + 1);
console.log("Last Monday:", getLastMonday());

// Endpoint to handle form submissions
app.post("/submit", (req, res) => {
  const formData = req.body;
  console.log("hello");
  console.log("Received form data:", formData);

  //   Insert the form data into the database
  const insertSql = `
          INSERT INTO wc (date, wc, category, projectName, userid)
          VALUES (?, ?, ?, ?, ?)
        `;
  db.run(
    insertSql,
    [
      formData.startDate,
      formData.wordCount,
      formData.category,
      formData.projectName,
      formData.userid,
    ],
    (err) => {
      if (err) {
        console.error("Error inserting data:", err.message);
        res.status(500).json({ error: "Failed to insert data" });
      } else {
        console.log("Data inserted successfully.");

        sql = `SELECT * FROM wc`;
        db.all(sql, [], (err, rows) => {
          if (err) return console.error(err.message);
          rows.forEach((row) => {
            console.log(row);
          });
        });

        res.json({ message: "Data received and inserted successfully" });
      }
    }
  );
});

app.post("/initial", (req, res) => {
  console.log("this happened");
  console.log("Received form data:", req.body);
  id = req.body.userid;
  time = req.body.time;
  startDate = null;

  if (time === "lastmonday") {
    startDate = lastMonday;
  } else if (time === "lastwk") {
    // Get the date 7 days ago
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 5);
    startDate = lastWeek.toISOString().split("T")[0];
  } else if (time === "last30days") {
    // Get the date 30 days ago
    const today = new Date();
    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 30);
    startDate = last30Days.toISOString().split("T")[0];
  } else if (time === "lastyear") {
    // Get the date from 12 months ago
    const today = new Date();
    const lastYear = new Date(today);
    lastYear.setMonth(today.getMonth() - 12);
    startDate = lastYear.toISOString().split("T")[0];
  } else if (time === "alltime") {
    startDate = "2000-01-01";
  }

  console.log("Start Date:", startDate);

  //fetch and display contents of sql database, get it in a form that it can be fed back
  let dataByDate = {};
  sql = `SELECT * FROM wc WHERE userid = ? AND date >= ? ORDER BY date`;
  db.all(sql, [id, startDate], (err, rows) => {
    if (err) return console.error(err.message);
    rows.forEach((row) => {
      console.log(row);
      console.log(row.date);
      if (!dataByDate[row.date]) {
        dataByDate[row.date] = [];
      }
      dataByDate[row.date].push({
        wc: row.wc,
        category: row.category,
        projectName: row.projectName,
      });
    });

    // Only update startDate to first data date if viewing all time
    if (time === "alltime") {
      const dates = Object.keys(dataByDate).sort();
      const firstDataDate = dates.length > 0 ? dates[0] : startDate;
      startDate = firstDataDate > startDate ? firstDataDate : startDate;
    }

    res.json({
      data: dataByDate,
      startDate: startDate,
    });
  });
});

app.post("/getrecords", (req, res) => {
  const id = req.body.userid;

  // Query database for all records matching userid
  const sql = `SELECT * FROM wc WHERE userid = ? ORDER BY date`;

  db.all(sql, [id], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: "Database error" });
      return;
    }

    // Group records by date
    let dataByDate = {};
    rows.forEach((row) => {
      if (!dataByDate[row.date]) {
        dataByDate[row.date] = [];
      }
      dataByDate[row.date].push({
        id: row.id,
        wc: row.wc,
        category: row.category,
        projectName: row.projectName,
      });
    });

    res.json(dataByDate);
  });
});

app.post("/delete", (req, res) => {
  const id = req.body.id;
  const sql = `DELETE FROM wc WHERE id = ?`;

  db.run(sql, [id], function (err) {
    if (err || this.changes === 0) {
      res.json({ error: "there was an error" });
      return;
    }
    res.json({ message: "success" });
  });
});

// let sql;
// will get rid of this once we get out of test mode
// sql = `DROP TABLE IF EXISTS wc`;
// db.run(sql);
// sql = `CREATE TABLE IF NOT EXISTS wc (id INTEGER PRIMARY KEY, date DATE, wc INT, category CHAR)`;
// db.run(sql);
