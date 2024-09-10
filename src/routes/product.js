const express = require('express');
const router = express.Router();
const upload = require('../app/middlewares/UploadProductImg');

const productController = require('../app/controllers/ProductController');
router.post(
    '/add_product',
    upload.fields([
        { name: 'productImages', maxCount: 9 }, // Tối đa 10 hình ảnh
        { name: 'productBackGroundImage', maxCount: 1 }, // Tối đa 1 hình nền
    ]),
    productController.addProduct,
);
router.post('/seller/latest_products', productController.getSellerLatestProduct);
router.get('/:slug', productController.getProductDetail);
router.get('/', productController.getProducts);

module.exports = router;
