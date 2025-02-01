const express = require('express');
const router = express.Router();
const UserController = require('../app/controllers/UserController');

router.post('/add_product_to_cart', UserController.addProductToCard);
router.get('/get_cart_items', UserController.getCartItems);

module.exports = router;
