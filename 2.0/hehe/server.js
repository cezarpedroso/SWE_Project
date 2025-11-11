import express from "express";
import bcrypt from "bcrypt";
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import db from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

// Simple session storage (in production, use Redis or proper sessions)
const sessions = new Map();

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  const userId = req.headers.authorization;
  if (!userId || !sessions.has(userId)) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  req.userId = userId;
  next();
};

/* =========================================================
   USER AUTHENTICATION ROUTES
   ========================================================= */

// Serve signup page
app.get("/signup.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public/signup.html"));
});

// Serve login page  
app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public/login.html"));
});

// Serve main app
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// --- Signup Route ---
app.post("/api/signup", async (req, res) => {
  const { username, email, password, userLocation = "" } = req.body;

  console.log("🔐 Signup attempt for:", username, email);

  if (!username || !password) {
    console.log("❌ Missing required fields");
    return res.status(400).json({ error: "Username and password are required" });
  }

  // Check for duplicate username - using the actual column names
  db.get(
    "SELECT * FROM users WHERE username = ? OR email = ?",
    [username, email],
    async (err, existingUser) => {
      if (err) {
        console.error("❌ Database error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      
      if (existingUser) {
        console.log("❌ User already exists:", existingUser.username);
        return res.status(400).json({ error: "Username or email already exists" });
      }

      try {
        console.log("🔑 Hashing password...");
        const hash = await bcrypt.hash(password, 10);
        console.log("✅ Password hashed successfully");

        // Use the actual column names from your database including email and userLocation
        const sql = `INSERT INTO users (username, password, email, userLocation) VALUES (?, ?, ?, ?)`;
        
        console.log("📝 Executing SQL:", sql);
        console.log("📝 With values:", [username, hash, email, userLocation]);

        db.run(sql, [username, hash, email, userLocation], function (err) {
          if (err) {
            console.error("❌ Insert error:", err.message);
            return res.status(500).json({ error: "Failed to create user: " + err.message });
          }
          
          console.log("✅ User created successfully with ID:", this.lastID);
          
          res.status(201).json({ 
            message: "User created successfully", 
            userId: this.lastID 
          });
        });

      } catch (error) {
        console.error("❌ Hash error:", error);
        res.status(500).json({ error: "Error hashing password" });
      }
    }
  );
});

// --- Login Route ---
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  console.log("🔐 Login attempt for username:", username);

  if (!username || !password) {
    console.log("❌ Missing username or password");
    return res.status(400).json({ error: "Username and password required" });
  }

  // Use the actual column names: username and password
  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    if (!user) {
      console.log("❌ No user found with username:", username);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("✅ Found user:", user.username);
    console.log("✅ Password hash exists:", !!user.password);

    try {
      const valid = await bcrypt.compare(password, user.password);
      console.log("✅ Password comparison result:", valid);
      
      if (!valid) {
        console.log("❌ Password does not match");
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Create simple session
      const sessionId = `user-${user.id}`;
      sessions.set(sessionId, {
        userId: user.id,
        username: user.username
      });

      console.log("✅ Login successful for user:", user.username);
      res.json({ 
        message: "Login successful", 
        userId: user.id, 
        username: user.username,
        sessionId: sessionId
      });
    } catch (error) {
      console.error("❌ Bcrypt error:", error);
      res.status(500).json({ error: "Authentication error" });
    }
  });
});

// --- Logout Route ---
app.post("/api/logout", (req, res) => {
  const sessionId = req.headers.authorization;
  if (sessionId) {
    sessions.delete(sessionId);
  }
  res.json({ message: "Logged out successfully" });
});

/* =========================================================
   PROTECTED ROUTES
   ========================================================= */

// --- Items API ---
app.get("/api/items", requireAuth, (req, res) => {
  db.all("SELECT * FROM Inventor", (err, rows) => {
    if (err) {
      console.error("Items error:", err);
      return res.status(500).json({ error: err.message });
    }
    // Map to match frontend field names
    const items = rows.map(row => ({
      id: row.Inv_itemID,
      name: row.Inv_itemName,
      description: row.Inv_itemDesc
    }));
    res.json(items);
  });
});

app.get("/api/items/:id", requireAuth, (req, res) => {
  db.get("SELECT * FROM Inventor WHERE Inv_itemID = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Item not found" });
    res.json({
      id: row.Inv_itemID,
      name: row.Inv_itemName,
      description: row.Inv_itemDesc
    });
  });
});

app.post("/api/items", requireAuth, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "Item name required" });
  
  db.run(
    `INSERT INTO Inventor (Inv_itemName, Inv_itemDesc, Inv_UserID)
     VALUES (?, ?, ?)`,
    [name, description, req.userId.replace('user-', '')],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put("/api/items/:id", requireAuth, (req, res) => {
  const { name, description } = req.body;
  db.run(
    `UPDATE Inventor SET Inv_itemName = ?, Inv_itemDesc = ? WHERE Inv_itemID = ?`,
    [name, description, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Item updated" });
    }
  );
});

app.delete("/api/items/:id", requireAuth, (req, res) => {
  db.run("DELETE FROM Inventor WHERE Inv_itemID = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Item deleted" });
  });
});

// --- People API ---
app.get("/api/people", requireAuth, (req, res) => {
  db.all(`
    SELECT p.*, GROUP_CONCAT(s.Title) as services 
    FROM people p 
    LEFT JOIN PersonServices ps ON p.PersonID = ps.PersonID 
    LEFT JOIN Services s ON ps.ServiceID = s.ServiceID 
    GROUP BY p.PersonID
  `, (err, rows) => {
    if (err) {
      console.error("People error:", err);
      return res.status(500).json({ error: err.message });
    }
    const people = rows.map(row => ({
      id: row.PersonID,
      name: row.Name,
      email: row.Email,
      services: row.services
    }));
    res.json(people);
  });
});

app.post("/api/people", requireAuth, (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Name and email required" });
  
  db.run(
    `INSERT INTO people (Name, Email) VALUES (?, ?)`,
    [name, email],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

// --- Services API ---
app.get("/api/services", requireAuth, (req, res) => {
  db.all("SELECT * FROM services", (err, rows) => {
    if (err) {
      console.error("Services error:", err);
      return res.status(500).json({ error: err.message });
    }
    const services = rows.map(row => ({
      id: row.ServiceID,
      title: row.Title,
      description: row.Description
    }));
    res.json(services);
  });
});

app.post("/api/services", requireAuth, (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: "Title required" });
  
  db.run(
    `INSERT INTO services (Title, Description) VALUES (?, ?)`,
    [title, description],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

// --- Assign Service to Person ---
app.post("/api/people/:personId/services/:serviceId", requireAuth, (req, res) => {
  const { personId, serviceId } = req.params;
  
  db.run(
    `INSERT OR REPLACE INTO PersonServices (PersonID, ServiceID) VALUES (?, ?)`,
    [personId, serviceId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Service assigned to person" });
    }
  );
});

// --- Requests API ---
app.get("/api/requests", requireAuth, (req, res) => {
  db.all("SELECT * FROM Requests", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/requests", requireAuth, (req, res) => {
  const { RequestUser, RequestType, DonationName, DonationDesc } = req.body;
  if (!RequestUser || !RequestType)
    return res.status(400).json({ error: "Missing required fields" });
  db.run(
    `INSERT INTO Requests (RequestUser, RequestType, DonationName, DonationDesc)
     VALUES (?, ?, ?, ?)`,
    [RequestUser, RequestType, DonationName, DonationDesc],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

/* =========================================================
   SERVER START
   ========================================================= */

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Signup: http://localhost:${PORT}/signup.html`);
  console.log(`✅ Login: http://localhost:${PORT}/login.html`);
  console.log(`✅ Main App: http://localhost:${PORT}/`);
});
