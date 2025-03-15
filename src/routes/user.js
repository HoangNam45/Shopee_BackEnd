const express = require('express');
const router = express.Router();
const UserController = require('../app/controllers/UserController');
const upload = require('../app/middlewares/UploadUserAvatar.js');

router.put('/update_user_info', upload.single('Avatar'), UserController.updateUserInfo);
router.post('/add_product_to_cart', UserController.addProductToCard);
router.get('/get_cart_items', UserController.getCartItems);
router.put('/update_cart_item_quantity', UserController.updateCartItemQuantity);
router.delete('/delete_cart_item/:productId', UserController.deleteCartItem);
router.get('/get_user_info', UserController.getUserInfo);

router.post('/create_order', UserController.createOrder);

router.get('/pending_purchases', UserController.getPendingPurchases);
router.get('/shipping_purchases', UserController.getShippingPurchases);
router.get('/all_purchases', UserController.getAllPurchases);
router.get('/canceled_purchases', UserController.getCanceledPurchases);
router.get('/completed_purchases', UserController.getCompletedPurchases);
router.get('/fail_delivery_purchases', UserController.getFailDeliveryPurchases);

module.exports = router;
