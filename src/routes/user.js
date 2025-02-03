const express = require('express');
const router = express.Router();
const UserController = require('../app/controllers/UserController');

router.post('/add_product_to_cart', UserController.addProductToCard);
router.get('/get_cart_items', UserController.getCartItems);
router.put('/update_cart_item_quantity', UserController.updateCartItemQuantity);
router.delete('/delete_cart_item/:productId', UserController.deleteCartItem);
module.exports = router;
