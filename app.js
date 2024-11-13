const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
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

// Google Sheets API setup
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json', // Path to your credentials file
    scopes: SCOPES
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = '1dtFx_n985esZD5r3Z2xek9dY3PH2Zq6Py8deV3b_XKc'; // Replace with your Google Sheets ID

// Serve static files
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Endpoint to save data from form to Google Sheets
app.post('/save-data', upload.fields([{ name: 'cccd', maxCount: 10 }, { name: 'gpkd', maxCount: 10 }]), async (req, res) => {
    try {
        const { khu_vuc, ten_shop, dia_chi } = req.body;
        const cccdPaths = req.files['cccd'] ? req.files['cccd'].map(file => file.path).join(',') : '';
        const gpkdPaths = req.files['gpkd'] ? req.files['gpkd'].map(file => file.path).join(',') : '';

        // Append data to Google Sheets
        const values = [[null, khu_vuc, ten_shop, dia_chi, cccdPaths, gpkdPaths]];
        const resource = {
            values,
        };
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A:F', // Update the range to match your sheet
            valueInputOption: 'RAW',
            resource,
        });

        res.status(200).send('Lưu dữ liệu thành công.');
    } catch (err) {
        console.error('Lỗi khi lưu dữ liệu:', err.message);
        res.status(500).send('Lỗi khi lưu dữ liệu.');
    }
});

// Endpoint to retrieve the list of data from Google Sheets
app.get('/get-data', async (req, res) => {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A:F', // Update the range to match your sheet
        });
        const rows = response.data.values;
        if (rows.length) {
            res.json(rows);
        } else {
            res.status(404).send('Không có dữ liệu.');
        }
    } catch (err) {
        console.error('Lỗi khi lấy dữ liệu:', err.message);
        res.status(500).send('Lỗi khi lấy dữ liệu.');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
