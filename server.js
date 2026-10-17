const { addExpressMiddleware } = require("@aikidosec/firewall");
const express = require("express");
const Database = require("better-sqlite3");
const fs = require("node:fs");
const path = require("node:path");

const db = new Database(":memory:");
db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)");
db.exec("INSERT INTO users VALUES (1, 'Alice', 'alice@example.com')");
db.exec("INSERT INTO users VALUES (2, 'Bob', 'bob@example.com')");
db.exec("INSERT INTO users VALUES (3, 'Charlie', 'charlie@example.com')");

const DOCS_DIR = path.join(__dirname, "docs");
fs.mkdirSync(DOCS_DIR, { recursive: true });
fs.writeFileSync(path.join(DOCS_DIR, "readme.txt"), "Welcome to the demo app.");
fs.writeFileSync(path.join(DOCS_DIR, "guide.txt"), "This is a user guide.");

const app = express();
addExpressMiddleware(app);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    endpoints: {
      "/search?q=alice": "Search users by name (SQL query)",
      "/file?name=readme.txt": "Read a document file",
      "/login": "POST {username, password}",
    },
  });
});

app.get("/search", (req, res) => {
  const q = req.query.q || "";
  const rows = db.prepare(`SELECT * FROM users WHERE name LIKE '%${q}%'`).all();
  res.json({ query: q, results: rows });
});

app.get("/file", (req, res) => {
  const name = req.query.name || "readme.txt";
  try {
    const filePath = path.join(DOCS_DIR, name);
    const content = fs.readFileSync(filePath, "utf-8");
    res.json({ file: name, content });
  } catch (err) {
    if (err.message && err.message.includes("Zen has blocked")) {
      res.status(403).json({ blocked: true, reason: "Path traversal detected by Aikido Zen" });
      return;
    }
    res.status(404).json({ error: "File not found" });
  }
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const row = db.prepare(`SELECT * FROM users WHERE name = '${username}' AND email = '${password}'`).get();
  res.json({ authenticated: !!row, user: row || null });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Aikido Firewall demo on http://localhost:${PORT}`);
});
