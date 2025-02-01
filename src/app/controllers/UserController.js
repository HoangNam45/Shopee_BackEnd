const {
    addProductToCard,
    checkProductInCart,
    updateProductQuantityInCart,
    getUserCartItems,
} = require('../../services/userService');

class UserController {
    // [POST] /user/add_product_to_cart
    async addProductToCard(req, res) {
        try {
            const { product_id, quantity } = req.body;
            const user = req.user;
            const cart_id = user.cart_id;

            const existingProduct = await checkProductInCart({ cart_id, product_id });
            console.log('existingProduct', existingProduct);
            if (existingProduct) {
                const newQuantity = existingProduct.quantity + quantity;
                await updateProductQuantityInCart({ cart_id, product_id, newQuantity });
            } else {
                await addProductToCard({ cart_id, product_id, quantity });
            }

            res.status(200).json({ message: 'Product added to cart' });
        } catch (error) {
            console.error('Error updating seller information', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // [GET] /user/get_cart_items
    async getCartItems(req, res) {
        try {
            const user = req.user;
            const cart_id = user.cart_id;
            const cart_items = await getUserCartItems(cart_id);
            res.status(200).json(cart_items);
        } catch (error) {
            console.error('Error getting cart items', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
}

module.exports = new UserController();
