const {
    addProductToCard,
    checkProductInCart,
    updateProductQuantityInCart,
    getUserCartItems,
    deleteUserCartItem,
} = require('../../services/userService');
const { getProductById } = require('../../services/productService');

class UserController {
    // [POST] /user/add_product_to_cart
    async addProductToCard(req, res) {
        try {
            const { product_id, quantity } = req.body;
            const user = req.user;
            const cart_id = user.cart_id;

            const existingProduct = await checkProductInCart({ cart_id, product_id });

            const product = await getProductById(product_id);
            const stock = product.Stock;
            console.log(stock);

            let newQuantity;
            if (existingProduct) {
                newQuantity = existingProduct.quantity + quantity;
            } else {
                newQuantity = quantity;
            }

            if (newQuantity > stock) {
                newQuantity = stock;
            }

            if (existingProduct) {
                await updateProductQuantityInCart({ cart_id, product_id, newQuantity });
            } else {
                await addProductToCard({ cart_id, product_id, quantity: newQuantity });
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

    // [PUT] /user/update_cart_item_quantity
    async updateCartItemQuantity(req, res) {
        try {
            const { product_id, quantity } = req.body;
            const newQuantity = quantity;
            const user = req.user;
            const cart_id = user.cart_id;

            await updateProductQuantityInCart({ cart_id, product_id, newQuantity });

            res.status(200).json({ message: 'Cart item quantity updated' });
        } catch (error) {
            console.error('Error updating cart item quantity', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // [DELETE] /user/delete_cart_item/:productId
    async deleteCartItem(req, res) {
        try {
            const { productId } = req.params;
            const user = req.user;
            const cart_id = user.cart_id;

            await deleteUserCartItem({ cart_id, product_id: productId });

            res.status(200).json({ message: 'Cart item deleted' });
        } catch (error) {
            console.error('Error deleting cart item', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
}

module.exports = new UserController();
