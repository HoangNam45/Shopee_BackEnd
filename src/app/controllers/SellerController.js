const { decodeToken } = require('../../services/authService');
const {
    getSellerByUserId,
    updateSellerInfo,
    createDiscount,
    getSellerPendingOrders,
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
}

module.exports = new SellerController();
