const express = require('express');
const router = express.Router();

const DiscountController = require('../app/controllers/DiscountController');
router.post('/createDiscount', DiscountController.createDiscount);
router.get('/getDiscounts/:productId', DiscountController.getDiscounts);
module.exports = router;
