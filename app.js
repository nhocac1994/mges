const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');

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

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopsDB', {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000,
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err.message);
  });





// Define a Mongoose schema and model
const shopSchema = new mongoose.Schema({
    khu_vuc: { type: String, required: true },
    ten_shop: { type: String, required: true },
    dia_chi: { type: String, required: true },
    cccd: String,
    gpkd: String
});

const Shop = mongoose.model('Shop', shopSchema);

// Serve static files
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Endpoint to save data from form to MongoDB
app.post('/save-data', upload.fields([{ name: 'cccd', maxCount: 10 }, { name: 'gpkd', maxCount: 10 }]), async (req, res) => {
    try {
        const { khu_vuc, ten_shop, dia_chi } = req.body;
        const cccdPaths = req.files['cccd'] ? req.files['cccd'].map(file => file.path).join(',') : null;
        const gpkdPaths = req.files['gpkd'] ? req.files['gpkd'].map(file => file.path).join(',') : null;

        const newShop = new Shop({
            khu_vuc,
            ten_shop,
            dia_chi,
            cccd: cccdPaths,
            gpkd: gpkdPaths
        });

        await newShop.save();
        res.status(200).send('Lưu dữ liệu thành công.');
    } catch (err) {
        console.error('Lỗi khi lưu dữ liệu:', err.message);
        res.status(500).send('Lỗi khi lưu dữ liệu.');
    }
});

// Endpoint to retrieve the list of data from MongoDB
app.get('/get-data', async (req, res) => {
    try {
        const shops = await Shop.find();
        res.json(shops);
    } catch (err) {
        console.error('Lỗi khi lấy dữ liệu:', err.message);
        res.status(500).send('Lỗi khi lấy dữ liệu.');
    }
});

// Endpoint to retrieve detailed data from MongoDB by ID
app.get('/get-data/:id', async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);
        if (shop) {
            res.json(shop);
        } else {
            res.status(404).send('Không tìm thấy dữ liệu.');
        }
    } catch (err) {
        console.error('Lỗi khi lấy dữ liệu chi tiết:', err.message);
        res.status(500).send('Lỗi khi lấy dữ liệu chi tiết.');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
