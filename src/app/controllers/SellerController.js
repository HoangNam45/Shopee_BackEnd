const { decodeToken } = require('../../services/authService');
const { getSellerByUserId, updateSellerInfo } = require('../../services/sellerService');
class SellerController {
    // [GET] /seller/information
    async getSellerInfo(req, res) {
        try {
            // Xử lý token
            const token = req.headers.authorization.split(' ')[1]; // 'Bearer <token>'
            const decoded = await decodeToken(token);
            const userId = decoded.id;

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
            const { shopName } = req.body;
            // Xử lý token
            const token = req.headers.authorization.split(' ')[1]; // 'Bearer
            const decoded = decodeToken(token);
            const userId = decoded.id;

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
}

module.exports = new SellerController();
