const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "..", "books.db");
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (error) {
      if (error) return reject(error);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) return reject(error);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) return reject(error);
      resolve(rows);
    });
  });
}

async function initializeDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      price REAL NOT NULL CHECK(price >= 0),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const row = await get("SELECT COUNT(*) AS count FROM books");
  if (row.count === 0) {
    await run(
      "INSERT INTO books (title, author, price) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)",
      [
        "The Alchemist", "Paulo Coelho", 299,
        "Wings of Fire", "A. P. J. Abdul Kalam", 250,
        "Atomic Habits", "James Clear", 450
      ]
    );
  }
}

module.exports = { db, run, get, all, initializeDatabase };
