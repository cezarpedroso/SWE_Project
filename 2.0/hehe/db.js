// db.js - UPDATED FOR ES MODULES
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, "crp.db");
const db = new sqlite3.Database(dbPath);

export default db;
