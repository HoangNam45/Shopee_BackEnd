const express = require('express');
const router = express.Router();
const upload = require('../app/middlewares/UpdateSellerInformation');

const SellerController = require('../app/controllers/SellerController');
router.get('/information', SellerController.getSellerInfo);
router.put('/updateInformation', upload.single('shopAvt'), SellerController.updateSellerInfo);

router.get('/pending_orders', SellerController.getSellerPendingOrders);

module.exports = router;
