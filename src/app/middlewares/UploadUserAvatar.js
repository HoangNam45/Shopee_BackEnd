// config/multerConfig.js
const path = require('path');
const multer = require('multer');

// Cấu hình lưu trữ
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/uploads/images/userAvatar');
    },
    filename: (req, file, cb) => {
        // Đặt tên file theo kiểu: tên gốc + thời gian
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

// Tạo instance multer với cấu hình
const upload = multer({ storage });

module.exports = upload;
