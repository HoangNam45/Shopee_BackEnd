require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const port = 5000;
const route = require('./routes/index');
const cors = require('cors');

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Thêm dòng này để parse JSON bodies
//Sử dụng biến môi trường

// Connect backend to frontend
const corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
route(app);
// Cấu hình để phục vụ tệp tĩnh từ thư mục "uploads"
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
app.use('/assets', express.static(path.join(__dirname, '/assets')));
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
