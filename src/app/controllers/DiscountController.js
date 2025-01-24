const { get } = require('../../routes/discount');
const {
    createDiscount,
    getDiscounts,
    getSellerDiscounts,
    getSellerDiscountedProducts,
    deleteDiscount,
} = require('../../services/discountService');

class DiscountController {
    //[POST] /discount/createDiscount
    async createDiscount(req, res) {
        try {
            const user = req.user;
            const sellerId = user.seller_id;
            const discountData = req.body;
            await createDiscount({ discountData, sellerId });
            res.status(200).json('Create discount successfully');
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }

    //[GET] /discount/getDiscounts
    async getDiscounts(req, res) {
        try {
            const productId = req.params.productId;
            const discounts = await getDiscounts({ productId });

            res.status(200).json(discounts);
        } catch (error) {
            console.log('Error getting discounts', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async getSellerDiscounts(req, res) {
        try {
            const user = req.user;
            const sellerId = user.seller_id;
            const discounts = await getSellerDiscounts({ sellerId });

            res.status(200).json(discounts);
        } catch (error) {
            console.log('Error getting discounts', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async getSellerDiscountedProducts(req, res) {
        const user = req.user;
        const sellerId = user.seller_id;
        try {
            const discountedProducts = await getSellerDiscountedProducts({ sellerId });
            res.status(200).json(discountedProducts);
        } catch (error) {
            console.log('Error getting discounts', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    //[DELETE] /discount/deleteDiscount
    async deleteDiscount(req, res) {
        try {
            const discountId = req.params.discountId;
            await deleteDiscount({ discountId });
            res.status(200).json('Delete discount successfully');
        } catch (error) {
            console.log('Error deleting discount', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
}
module.exports = new DiscountController();
