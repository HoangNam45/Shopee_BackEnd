const { createDiscount, getDiscounts } = require('../../services/discountService');

class DiscountController {
    //[POST] /discount/createDiscount
    async createDiscount(req, res) {
        try {
            const user = req.user;
            const userId = user.id;
            const discountData = req.body;

            await createDiscount({ discountData });

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
}
module.exports = new DiscountController();
