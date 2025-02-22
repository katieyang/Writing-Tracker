const express = require("express");
const path = require("path");

const app = express();

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Start the server
const PORT = 3000;

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
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
  const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
  const lastMonday = new Date(today);

  // Calculate the difference to the last Monday
  const diff = (dayOfWeek + 6) % 7; // Adjust so that Monday is 0
  lastMonday.setDate(today.getDate() - diff);

  return lastMonday.toISOString().split("T")[0];
}

lastMonday = getLastMonday();
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
    lastWeek.setDate(today.getDate() - 7);
    startDate = lastWeek.toISOString().split("T")[0];
  } else if (time === "lastmonth") {
    // Get the date of the first day of the month
    const today = new Date();
    startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split("T")[0];
  } else if (time === "lastyear") {
    // Get the date of the first day of the year
    const today = new Date();
    startDate = new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0];
  } else if (time === "alltime") {
    startDate = "2000-01-01";
  }

  console.log("Start Date:", startDate);

  //fetch and display contents of sql database, get it in a form that it can be fed back
  dates = [];
  wc = [];
  categories = [];
  projectNames = [];
  sql = `SELECT * FROM wc WHERE userid = ? AND date >= ? ORDER BY date`;
  db.all(sql, [id, startDate], (err, rows) => {
    if (err) return console.error(err.message);
    rows.forEach((row) => {
      console.log(row);
      console.log(row.date);
      dates.push(row.date);
      wc.push(row.wc);
      categories.push(row.category);
      projectNames.push(row.projectName);
    });

    res.json({
      dates: dates,
      wc: wc,
      categories: categories,
      projectNames: projectNames,
    });
  });
});

// let sql;
// will get rid of this once we get out of test mode
// sql = `DROP TABLE IF EXISTS wc`;
// db.run(sql);
// sql = `CREATE TABLE IF NOT EXISTS wc (id INTEGER PRIMARY KEY, date DATE, wc INT, category CHAR)`;
// db.run(sql);
