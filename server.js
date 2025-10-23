// Server file updated against SQL injection protection

// server.js — single Express app serving API + static UI
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "./db.js";

const app = express();
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, "public")));

// ID sanitization for SQL injection protection
const sanitizeId = (input) => {
  const id = parseInt(input);
  return isNaN(id) ? null : id;
};

// root
app.get("/health", (_req, res) => res.json({ ok: true }));

// -------- Meta --------
app.get("/api/meta/tables", (_req, res) => {
  const sql = `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => r.name));
  });
});

/* =====================
   Items (classic CRUD)
   ===================== */

// List items
app.get("/api/items", (_req, res) => {
  db.all("SELECT * FROM items ORDER BY id ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get item
app.get("/api/items/:id", (req, res) => {
  const id = sanitizeId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid ID" });

  db.get("SELECT * FROM items WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Item not found" });
    res.json(row);
  });
});

// Create item
app.post("/api/items", (req, res) => {
  const { name, description = "" } = req.body || {};
  if (!name) return res.status(400).json({ error: "name is required" });

  db.run("INSERT INTO items(name, description) VALUES(?, ?)", [name, description], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, name, description });
  });
});

// Update item
app.put("/api/items/:id", (req, res) => {
  const id = sanitizeId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid ID" });

  const { name, description = "" } = req.body || {};
  if (!name) return res.status(400).json({ error: "name is required" });

  db.run("UPDATE items SET name=?, description=? WHERE id=?", [name, description, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (!this.changes) return res.status(404).json({ error: "Item not found" });
    res.json({ id, name, description });
  });
});

// Delete item
app.delete("/api/items/:id", (req, res) => {
  const id = sanitizeId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid ID" });

  db.run("DELETE FROM items WHERE id=?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (!this.changes) return res.status(404).json({ error: "Item not found" });
    res.json({ deleted: id });
  });
});

// below is the demo

// Create person
app.post("/api/people", (req, res) => {
  const { name, email } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: "name and email are required" });
  db.run("INSERT INTO people(name, email) VALUES(?, ?)", [name, email], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, name, email });
  });
});

// List people (with aggregated services)
app.get("/api/people", (_req, res) => {
  const sql = `
    SELECT p.id, p.name, p.email,
           COALESCE(GROUP_CONCAT(s.title, ', '), '') AS services
    FROM people p
    LEFT JOIN people_services ps ON p.id = ps.person_id
    LEFT JOIN services s ON ps.service_id = s.id
    GROUP BY p.id
    ORDER BY p.id ASC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create service
app.post("/api/services", (req, res) => {
  const { title, description = "" } = req.body || {};
  if (!title) return res.status(400).json({ error: "title is required" });
  db.run("INSERT INTO services(title, description) VALUES(?, ?)", [title, description], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, title, description });
  });
});

// List services
app.get("/api/services", (_req, res) => {
  db.all("SELECT * FROM services ORDER BY id ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Link service to person
app.post("/api/people/:id/services/:serviceId", (req, res) => {
  const personId = sanitizeId(req.params.id);
  const serviceId = sanitizeId(req.params.serviceId);
  
  if (!personId || !serviceId) return res.status(400).json({ error: "Invalid person ID or service ID" });

  db.run(
    "INSERT INTO people_services(person_id, service_id) VALUES(?, ?)",
    [personId, serviceId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ ok: true });
    }
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
