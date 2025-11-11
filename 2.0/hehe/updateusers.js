// update-users-table.js
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, "crp.db");

const db = new sqlite3.Database(dbPath);

console.log("Updating users table structure...");

// Add missing columns to users table
db.serialize(() => {
  // Add email column if it doesn't exist
  db.run("ALTER TABLE users ADD COLUMN email TEXT", (err) => {
    if (err) {
      console.log("Email column already exists or error:", err.message);
    } else {
      console.log("✅ Added email column to users table");
    }
  });

  // Add userLocation column if it doesn't exist
  db.run("ALTER TABLE users ADD COLUMN userLocation TEXT", (err) => {
    if (err) {
      console.log("userLocation column already exists or error:", err.message);
    } else {
      console.log("✅ Added userLocation column to users table");
    }
  });

  // Add createdAt column if it doesn't exist
  db.run("ALTER TABLE users ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP", (err) => {
    if (err) {
      console.log("createdAt column already exists or error:", err.message);
    } else {
      console.log("✅ Added createdAt column to users table");
    }
  });

  // Verify the final table structure
  db.all("PRAGMA table_info(users)", (err, columns) => {
    console.log("\nFinal users table structure:");
    columns.forEach(col => {
      console.log(`- ${col.name} (${col.type}) ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
    db.close();
  });
});
