const express = require('express');
const router = express.Router();

const DiscountController = require('../app/controllers/DiscountController');
router.post('/createDiscount', DiscountController.createDiscount);
router.get('/getDiscounts/:productId', DiscountController.getDiscounts);
router.get('/getSellerDiscounts', DiscountController.getSellerDiscounts);
router.get('/getSellerDiscountedProducts', DiscountController.getSellerDiscountedProducts);
router.delete('/deleteDiscount/:discountId', DiscountController.deleteDiscount);
module.exports = router;
