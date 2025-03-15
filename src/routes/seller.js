const express = require('express');
const router = express.Router();
const upload = require('../app/middlewares/UpdateSellerInformation');

const SellerController = require('../app/controllers/SellerController');

router.get('/information', SellerController.getSellerInfo);
router.put('/updateInformation', upload.single('shopAvt'), SellerController.updateSellerInfo);

router.get('/pending_orders', SellerController.getSellerPendingOrders);
router.get('/all_orders', SellerController.getSellerAllOrders);
router.get('/shipping_orders', SellerController.getSellerShippingOrders);
router.get('/canceled_orders', SellerController.getSellerCanceledOrders);
router.get('/completed_orders', SellerController.getSellerCompletedOrders);
router.get('/failed_delivery_orders', SellerController.getSellerFailedDeliveryOrders);

router.put('/update_order_status/:orderId', SellerController.updateOrderStatus);

module.exports = router;
