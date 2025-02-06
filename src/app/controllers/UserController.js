const {
    addProductToCard,
    checkProductInCart,
    updateProductQuantityInCart,
    getUserCartItems,
    deleteUserCartItem,
    createOrder,
    createOrderDetail,
} = require('../../services/userService');
const { getProductById, updateProductStock } = require('../../services/productService');
const { poolPromise } = require('../../config/db/index');

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

    // [POST] /user/create_order
    async createOrder(req, res) {
        let transaction;
        try {
            const user = req.user;
            const cart_id = user.cart_id;
            const { name, phoneNumber, address, totalPrice, checkedProducts } = req.body;
            const pool = await poolPromise;
            transaction = pool.transaction();

            await transaction.begin();
            // Create order
            const order_id = await createOrder({
                user_id: user.id,
                name,
                phoneNumber,
                address,
                total_price: totalPrice,
                transaction,
            });

            console.log('order_id', order_id);
            // Create order detail
            for (const product of checkedProducts) {
                await createOrderDetail({
                    order_id,
                    product_id: product.Id,
                    quantity: product.quantity,
                    price: product.Final_price * product.quantity,
                    transaction,
                });
            }
            // Update product stock
            for (const product of checkedProducts) {
                await updateProductStock({
                    product_id: product.Id,
                    quantity: product.quantity,
                    transaction,
                });
            }
            // Delete cart items
            for (const product of checkedProducts) {
                await deleteUserCartItem({ cart_id, product_id: product.Id, transaction });
            }

            // Send notification to seller
            await transaction.commit();

            res.status(200).json({ message: 'Order created' });
        } catch (error) {
            await transaction.rollback();
            console.error('Error creating order', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
}

module.exports = new UserController();
