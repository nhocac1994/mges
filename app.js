const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Add body parsing middleware for JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize multer for storing image files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Initialize SQLite database
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS shops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            khu_vuc TEXT NOT NULL,
            ten_shop TEXT NOT NULL,
            dia_chi TEXT NOT NULL,
            cccd TEXT,
            gpkd TEXT
        )`);
    }
});

// Serve static files
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Endpoint to save data from form to SQLite
app.post('/save-data', upload.fields([{ name: 'cccd', maxCount: 10 }, { name: 'gpkd', maxCount: 10 }]), (req, res) => {
    const { khu_vuc, ten_shop, dia_chi } = req.body;
    const cccdPaths = req.files['cccd'] ? req.files['cccd'].map(file => file.path).join(',') : null;
    const gpkdPaths = req.files['gpkd'] ? req.files['gpkd'].map(file => file.path).join(',') : null;

    db.run(`INSERT INTO shops (khu_vuc, ten_shop, dia_chi, cccd, gpkd) VALUES (?, ?, ?, ?, ?)`,
        [khu_vuc, ten_shop, dia_chi, cccdPaths, gpkdPaths], function (err) {
            if (err) {
                console.error(err.message);
                res.status(500).send('Lỗi khi lưu dữ liệu.');
            } else {
                res.status(200).send('Lưu dữ liệu thành công.');
            }
        });
});

// Endpoint to retrieve the list of data from SQLite
app.get('/get-data', (req, res) => {
    const sql = `SELECT * FROM shops`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).send('Lỗi khi lấy dữ liệu.');
            return console.error(err.message);
        }
        res.json(rows);
    });
});

// Endpoint to retrieve detailed data from SQLite by ID
app.get('/get-data/:id', (req, res) => {
    const id = req.params.id;
    const sql = `SELECT * FROM shops WHERE id = ?`;
    db.get(sql, [id], (err, row) => {
        if (err) {
            res.status(500).send('Lỗi khi lấy dữ liệu chi tiết.');
            return console.error(err.message);
        }
        if (row) {
            res.json(row);
        } else {
            res.status(404).send('Không tìm thấy dữ liệu.');
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
