// check-users.js
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, "crp.db");

const db = new sqlite3.Database(dbPath);

console.log("Checking users in database...");

db.all("SELECT * FROM Users", (err, rows) => {
  if (err) {
    console.error("Error:", err);
    return;
  }
  
  console.log(`Found ${rows.length} users:`);
  rows.forEach(user => {
    console.log(`- ID: ${user.UserID}, Username: ${user.Username}, Email: ${user.Email}`);
    console.log(`  PasswordHash: ${user.PasswordHash ? 'Exists' : 'NULL'}`);
  });
  
  db.close();
});
