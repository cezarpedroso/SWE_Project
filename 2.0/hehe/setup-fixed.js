// setup-fixed.js
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, "crp.db");

// Create a TEMPORARY connection just for setup
const setupDb = new sqlite3.Database(dbPath);

console.log("🔄 Setting up database tables...");

setupDb.serialize(() => {
  // Users table
  setupDb.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT,
      password TEXT NOT NULL,
      userLocation TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error("❌ Error creating users table:", err.message);
    } else {
      console.log("✅ users table created");
    }
  });

  // Items table (Inventor)
  setupDb.run(`
    CREATE TABLE IF NOT EXISTS Inventor (
      Inv_itemID INTEGER PRIMARY KEY AUTOINCREMENT,
      Inv_itemName TEXT NOT NULL,
      Inv_itemDesc TEXT,
      Inv_itemLocation TEXT,
      Inv_UserID INTEGER,
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error("❌ Error creating Inventor table:", err.message);
    } else {
      console.log("✅ Inventor table created");
    }
  });

  // People table
  setupDb.run(`
    CREATE TABLE IF NOT EXISTS people (
      PersonID INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT NOT NULL,
      Email TEXT NOT NULL,
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error("❌ Error creating people table:", err.message);
    } else {
      console.log("✅ people table created");
    }
  });

  // Services table
  setupDb.run(`
    CREATE TABLE IF NOT EXISTS services (
      ServiceID INTEGER PRIMARY KEY AUTOINCREMENT,
      Title TEXT NOT NULL,
      Description TEXT,
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error("❌ Error creating services table:", err.message);
    } else {
      console.log("✅ services table created");
    }
  });

  // Person-Services relationship table
  setupDb.run(`
    CREATE TABLE IF NOT EXISTS PersonServices (
      PersonID INTEGER,
      ServiceID INTEGER,
      AssignedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (PersonID, ServiceID)
    )
  `, (err) => {
    if (err) {
      console.error("❌ Error creating PersonServices table:", err.message);
    } else {
      console.log("✅ PersonServices table created");
    }
  });

  // Requests table
  setupDb.run(`
    CREATE TABLE IF NOT EXISTS Requests (
      RequestID INTEGER PRIMARY KEY AUTOINCREMENT,
      RequestUser TEXT NOT NULL,
      RequestType TEXT NOT NULL,
      DonationName TEXT,
      DonationDesc TEXT,
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error("❌ Error creating Requests table:", err.message);
    } else {
      console.log("✅ Requests table created");
    }
  });
});

// Close ONLY the temporary setup connection
setupDb.close((err) => {
  if (err) {
    console.error("Error closing setup connection:", err);
  } else {
    console.log("🎉 Database setup completed successfully!");
    console.log("🚀 You can now start your server with: npm start");
  }
});
