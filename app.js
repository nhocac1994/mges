const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Khởi tạo multer để lưu trữ file hình ảnh
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Khởi tạo cơ sở dữ liệu SQLite
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

// Sử dụng thư mục public để chứa các tài nguyên tĩnh
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Endpoint để lưu dữ liệu từ form vào SQLite
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

// Endpoint để lấy danh sách dữ liệu từ SQLite
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

// Endpoint để lấy dữ liệu chi tiết từ SQLite theo ID
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

// Khởi động server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
