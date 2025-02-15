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

// Endpoint to handle form submissions
app.post("/submit", (req, res) => {
  const formData = req.body;
  console.log("hello");
  console.log("Received form data:", formData);

  //   Insert the form data into the database
  const insertSql = `
          INSERT INTO wc (date, wc, category)
          VALUES (?, ?, ?)
        `;
  db.run(
    insertSql,
    [formData.startDate, formData.wordCount, formData.category],
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

app.post("/test", (req, res) => {
  console.log("this happened");

  //fetch and display contents of sql database, get it in a form that it can be fed back
  dates = [];
  wc = [];
  categories = [];
  sql = `SELECT * FROM wc ORDER BY date`;
  db.all(sql, [], (err, rows) => {
    if (err) return console.error(err.message);
    rows.forEach((row) => {
      console.log(row);
      console.log(row.date);
      dates.push(row.date);
      wc.push(row.wc);
      categories.push(row.category);
    });

    res.json({
      dates: dates,
      wc: wc,
      categories: categories,
    });
  });
});

// let sql;
// will get rid of this once we get out of test mode
// sql = `DROP TABLE IF EXISTS wc`;
// db.run(sql);
// sql = `CREATE TABLE IF NOT EXISTS wc (id INTEGER PRIMARY KEY, date DATE, wc INT, category CHAR)`;
// db.run(sql);
