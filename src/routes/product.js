const express = require('express');
const router = express.Router();
const upload = require('../app/middlewares/UploadProductImg');
// const { checkUserToken } = require('../app/middlewares/JWTAction');
const productController = require('../app/controllers/ProductController');
router.post(
    '/add_product',
    upload.fields([
        { name: 'productImages', maxCount: 9 }, // Tối đa 10 hình ảnh
        { name: 'productBackGroundImage', maxCount: 1 }, // Tối đa 1 hình nền
    ]),
    productController.addProduct,
);

router.get('/seller/latest_products', productController.getSellerLatestProduct);
router.get('/seller/active_products', productController.getSellerActiveProduct);
router.get('/seller/hidden_products', productController.getSellerHiddenProduct);

router.get('/seller/total_products', productController.getSellerTotalProduct);
router.get('/seller/total_active_products', productController.getSellerTotalActiveProduct);
router.get('/seller/total_hidden_products', productController.getSellerTotalHiddenProduct);

router.get('/:slug', productController.getProductDetail);
router.get('/', productController.getProducts);

module.exports = router;
