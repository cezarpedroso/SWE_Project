// test-db.js
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, "crp.db");

console.log("🔍 Testing database connection...");

const testDb = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Cannot connect to database:", err.message);
  } else {
    console.log("✅ Connected to database successfully");
    
    testDb.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
      if (err) {
        console.error("❌ Error reading tables:", err.message);
      } else {
        console.log("📋 Tables found:", tables.map(t => t.name));
        
        // Check users table specifically
        testDb.all("SELECT * FROM users", (err, users) => {
          console.log(`👥 Users in database: ${users.length}`);
          users.forEach(user => {
            console.log(`   - ${user.username} (ID: ${user.id})`);
          });
          
          testDb.close();
        });
      }
    });
  }
});
