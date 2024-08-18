// config/multerConfig.js
const path = require('path');
const multer = require('multer');

// Cấu hình lưu trữ
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Xác định thư mục lưu trữ
        if (file.fieldname === 'productImages') {
            cb(null, 'src/uploads/images/productImages');
        } else if (file.fieldname === 'productBackGroundImage') {
            cb(null, 'src/uploads/images/productBackGroundImage');
        } else {
            cb(new Error('Invalid field name'), null);
        }
    },
    filename: (req, file, cb) => {
        // Đặt tên file theo kiểu: tên gốc + thời gian
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

// Tạo instance multer với cấu hình
const upload = multer({ storage });

module.exports = upload;
