const { decodeToken } = require('../../services/authService');
const {
    getSellerByUserId,
    updateSellerInfo,
    createDiscount,
    getSellerPendingOrders,
    getSellerAllOrders,
    getSellerShippingOrders,
    updateOrderStatus,
    getSellerCanceledOrders,
    getSellerCompletedOrders,
    getSellerFailedDeliveryOrders,
} = require('../../services/sellerService');
class SellerController {
    // [GET] /seller/information
    async getSellerInfo(req, res) {
        try {
            const user = req.user;
            const userId = user.id;

            const sellerData = await getSellerByUserId({ userId });
            console.log(sellerData);
            const respondSellerData = {
                name: sellerData.Name,
                avatar: sellerData.Avatar,
            };
            res.status(200).json(respondSellerData);
        } catch (error) {
            console.error('Error fetching products', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // [PUT] /seller/updateInformation
    async updateSellerInfo(req, res) {
        try {
            const user = req.user;
            const userId = user.id;

            const { shopName } = req.body;

            let avatar = '';
            if (req.file) {
                avatar = req.file.filename;
            } else {
                avatar = req.body.shopAvt;
            }

            const sellerNewInfo = await updateSellerInfo({ userId, shopName, avatar });

            res.status(200).json(sellerNewInfo);
        } catch (error) {
            console.error('Error updating seller information', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // [GET] /seller/pending_orders
    async getSellerPendingOrders(req, res) {
        try {
            const user = req.user;
            const sellerId = user.seller_id;
            const pendingOrders = await getSellerPendingOrders({ sellerId });

            res.status(200).json(pendingOrders);
        } catch (error) {
            console.error('Error fetching pending orders', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // [GET] /seller/all_orders
    async getSellerAllOrders(req, res) {
        try {
            const user = req.user;
            const sellerId = user.seller_id;
            const pendingOrders = await getSellerAllOrders({ sellerId });

            res.status(200).json(pendingOrders);
        } catch (error) {
            console.error('Error fetching pending orders', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    //[GET] /seller/shipping_orders
    async getSellerShippingOrders(req, res) {
        try {
            const user = req.user;
            const sellerId = user.seller_id;
            const shippingOrders = await getSellerShippingOrders({ sellerId });

            res.status(200).json(shippingOrders);
        } catch (error) {
            console.error('Error fetching pending orders', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    //[GET] /seller/canceled_orders
    async getSellerCanceledOrders(req, res) {
        try {
            const user = req.user;
            const sellerId = user.seller_id;
            const canceledOrders = await getSellerCanceledOrders({ sellerId });

            res.status(200).json(canceledOrders);
        } catch (error) {
            console.error('Error fetching pending orders', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    //[GET] /seller/completed_orders
    async getSellerCompletedOrders(req, res) {
        try {
            const user = req.user;
            const sellerId = user.seller_id;
            const completedOrders = await getSellerCompletedOrders({ sellerId });

            res.status(200).json(completedOrders);
        } catch (error) {
            console.error('Error fetching pending orders', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    //[GET] /seller/failed_delivery_orders
    async getSellerFailedDeliveryOrders(req, res) {
        try {
            const user = req.user;
            const sellerId = user.seller_id;
            const failedDeliveryOrders = await getSellerFailedDeliveryOrders({ sellerId });

            res.status(200).json(failedDeliveryOrders);
        } catch (error) {
            console.error('Error fetching pending orders', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
    // [PUT] /seller/update_order_status
    async updateOrderStatus(req, res) {
        try {
            const { orderId } = req.params;
            const { status } = req.body;
            await updateOrderStatus({ orderId, status });

            res.status(200).json('Updated order status successfully');
        } catch (error) {
            console.error('Error updating order status', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
}

module.exports = new SellerController();
