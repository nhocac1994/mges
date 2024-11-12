const express = require('express');
const multer = require('multer');
const Database = require('better-sqlite3'); // Thay đổi sqlite3 thành better-sqlite3
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

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

// Khởi tạo cơ sở dữ liệu với better-sqlite3
const db = new Database('./database.db');
db.exec(`CREATE TABLE IF NOT EXISTS shops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    khu_vuc TEXT NOT NULL,
    ten_shop TEXT NOT NULL,
    dia_chi TEXT NOT NULL,
    cccd TEXT,
    gpkd TEXT
)`);

// Serve static files
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Endpoint to save data from form to SQLite
app.post('/save-data', upload.fields([{ name: 'cccd', maxCount: 10 }, { name: 'gpkd', maxCount: 10 }]), (req, res) => {
    const { khu_vuc, ten_shop, dia_chi } = req.body;
    const cccdPaths = req.files['cccd'] ? req.files['cccd'].map(file => file.path).join(',') : null;
    const gpkdPaths = req.files['gpkd'] ? req.files['gpkd'].map(file => file.path).join(',') : null;

    try {
        const stmt = db.prepare(`INSERT INTO shops (khu_vuc, ten_shop, dia_chi, cccd, gpkd) VALUES (?, ?, ?, ?, ?)`);
        stmt.run(khu_vuc, ten_shop, dia_chi, cccdPaths, gpkdPaths);
        res.status(200).send('Lưu dữ liệu thành công.');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi khi lưu dữ liệu.');
    }
});

// Endpoint to retrieve the list of data from SQLite
app.get('/get-data', (req, res) => {
    try {
        const rows = db.prepare(`SELECT * FROM shops`).all();
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi khi lấy dữ liệu.');
    }
});

// Endpoint to retrieve detailed data from SQLite by ID
app.get('/get-data/:id', (req, res) => {
    const id = req.params.id;
    try {
        const row = db.prepare(`SELECT * FROM shops WHERE id = ?`).get(id);
        if (row) {
            res.json(row);
        } else {
            res.status(404).send('Không tìm thấy dữ liệu.');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi khi lấy dữ liệu chi tiết.');
    }
});

// Endpoint to delete a shop entry from SQLite by ID
app.delete('/delete-shop/:id', (req, res) => {
    const id = req.params.id;
    try {
        const stmt = db.prepare(`DELETE FROM shops WHERE id = ?`);
        const result = stmt.run(id);
        if (result.changes > 0) {
            res.sendStatus(200);
        } else {
            res.status(404).send('Không tìm thấy dữ liệu để xoá.');
        }
    } catch (err) {
        console.error("Error deleting shop:", err.message);
        res.status(500).send('Lỗi khi xoá dữ liệu.');
    }
});

// Endpoint to update a shop entry in SQLite by ID
app.put('/edit-shop/:id', upload.fields([{ name: 'cccd', maxCount: 10 }, { name: 'gpkd', maxCount: 10 }]), (req, res) => {
    const id = req.params.id;
    const { khu_vuc, ten_shop, dia_chi } = req.body;
    const cccdPaths = req.files['cccd'] ? req.files['cccd'].map(file => file.path).join(',') : null;
    const gpkdPaths = req.files['gpkd'] ? req.files['gpkd'].map(file => file.path).join(',') : null;

    try {
        const row = db.prepare(`SELECT * FROM shops WHERE id = ?`).get(id);
        if (!row) {
            res.status(404).send('Không tìm thấy dữ liệu để cập nhật.');
            return;
        }

        const updatedCccd = cccdPaths ? cccdPaths : row.cccd;
        const updatedGpkd = gpkdPaths ? gpkdPaths : row.gpkd;

        const stmt = db.prepare(`UPDATE shops SET khu_vuc = ?, ten_shop = ?, dia_chi = ?, cccd = ?, gpkd = ? WHERE id = ?`);
        stmt.run(khu_vuc, ten_shop, dia_chi, updatedCccd, updatedGpkd, id);
        res.status(200).send('Cập nhật dữ liệu thành công.');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi khi cập nhật dữ liệu.');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
