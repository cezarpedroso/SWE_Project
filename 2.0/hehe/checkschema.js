// check-users-table.js
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, "crp.db");

const db = new sqlite3.Database(dbPath);

console.log("Checking users table structure...");

db.all("PRAGMA table_info(users)", (err, columns) => {
  if (err) {
    console.error("Error:", err);
    return;
  }
  
  console.log("users table columns:");
  columns.forEach(col => {
    console.log(`- ${col.name} (${col.type}) ${col.pk ? 'PRIMARY KEY' : ''}`);
  });

  // Also check if there are any users
  db.all("SELECT * FROM users", (err, users) => {
    console.log(`\nFound ${users.length} users in 'users' table:`);
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Username: ${user.username}`);
      console.log(`  Email: ${user.email}, Password: ${user.password ? 'Exists' : 'NULL'}`);
    });
    db.close();
  });
});
