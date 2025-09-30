// file: databaseRoutes.js
const express = require('express');
const router = express.Router();

// Assume your coworker exports a connected db object from another file
const db = require('./db'); // db should be sqlite3.Database instance

// 1. SELECT / READ
router.get('/data', (req, res) => {
    const query = 'SELECT * FROM your_table_name';
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// 2. INSERT / CREATE
router.post('/data', (req, res) => {
    const { column1, column2 } = req.body; // customize based on your table
    const query = 'INSERT INTO your_table_name (column1, column2) VALUES (?, ?)';
    db.run(query, [column1, column2], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Row added', id: this.lastID });
    });
});

// 3. UPDATE
router.put('/data/:id', (req, res) => {
    const { id } = req.params;
    const { column1, column2 } = req.body; // customize
    const query = 'UPDATE your_table_name SET column1 = ?, column2 = ? WHERE id = ?';
    db.run(query, [column1, column2, id], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Row updated', changes: this.changes });
    });
});

// 4. DELETE
router.delete('/data/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM your_table_name WHERE id = ?';
    db.run(query, [id], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Row deleted', changes: this.changes });
    });
});

module.exports = router;
