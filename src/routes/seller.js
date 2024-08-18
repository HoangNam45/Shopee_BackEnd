const express = require('express');
const router = express.Router();

//middleware
const upload = require('../app/middlewares/UploadProductImg');
//controller
const sellerController = require('../app/controllers/SellerController');

router.post(
    '/add_product',
    upload.fields([
        { name: 'productImages', maxCount: 9 }, // Tối đa 10 hình ảnh
        { name: 'productBackGroundImage', maxCount: 1 }, // Tối đa 1 hình nền
    ]),
    sellerController.add_product,
);

module.exports = router;
