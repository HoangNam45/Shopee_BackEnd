const {
    addProductToCard,
    checkProductInCart,
    updateProductQuantityInCart,
    getUserCartItems,
    deleteUserCartItem,
    createOrder,
    createOrderDetail,
    getUserPendingOrders,
    getUserAllOrders,
    getUserInfo,
    getUserShippingOrders,
    getUserCompletedOrders,
    getUserCanceledOrders,
    getUserFailDeliveryOrders,
    updateUserInfo,
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
            const { name, phoneNumber, address, checkedProducts } = req.body;
            const pool = await poolPromise;
            transaction = pool.transaction();
            await transaction.begin();

            // 1. Group products by sellerId
            const productsBySeller = {};
            for (const product of checkedProducts) {
                if (!productsBySeller[product.SellerId]) {
                    productsBySeller[product.SellerId] = [];
                }
                productsBySeller[product.SellerId].push(product);
            }

            // 2. Create an order for each seller
            const orderIds = [];
            for (const sellerId in productsBySeller) {
                const sellerProducts = productsBySeller[sellerId];
                // Calculate total price for this seller's order
                const totalPrice = sellerProducts.reduce((sum, p) => sum + p.Final_price * p.quantity, 0);
                // Create order for this seller
                const order_id = await createOrder({
                    user_id: user.id,
                    name,
                    phoneNumber,
                    address,
                    total_price: totalPrice,
                    transaction,
                });
                orderIds.push(order_id);

                // Create order details for each product
                for (const product of sellerProducts) {
                    await createOrderDetail({
                        order_id,
                        product_id: product.Id,
                        quantity: product.quantity,
                        price: product.Final_price * product.quantity,
                        transaction,
                    });

                    // Update product stock
                    await updateProductStock({
                        product_id: product.Id,
                        quantity: product.quantity,
                        transaction,
                    });

                    // Remove from cart
                    await deleteUserCartItem({ cart_id, product_id: product.Id, transaction });
                }
            }

            await transaction.commit();
            res.status(200).json({ message: 'Order(s) created', orderIds });
        } catch (error) {
            if (transaction) await transaction.rollback();
            console.error('Error creating order', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // [GET] /user/pending_purchases
    async getPendingPurchases(req, res) {
        try {
            const user = req.user;
            const pendingPurchases = await getUserPendingOrders(user.id);
            console.log(pendingPurchases);
            res.status(200).json(pendingPurchases);
        } catch (error) {
            console.error('Error getting pending purchases', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // [GET] /user/all_purchases
    async getAllPurchases(req, res) {
        try {
            const user = req.user;
            const allPurchases = await getUserAllOrders(user.id);
            res.status(200).json(allPurchases);
        } catch (error) {
            console.error('Error getting all purchases', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // [GET] /user/shipping_purchases
    async getShippingPurchases(req, res) {
        try {
            const user = req.user;
            const shippingPurchases = await getUserShippingOrders(user.id);
            res.status(200).json(shippingPurchases);
        } catch (error) {
            console.error('Error getting shipping purchases', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // [GET] /user/completed_purchases
    async getCompletedPurchases(req, res) {
        try {
            const user = req.user;
            const completedPurchases = await getUserCompletedOrders(user.id);
            res.status(200).json(completedPurchases);
        } catch (error) {
            console.error('Error getting shipping purchases', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // [GET] /user/canceled_purchases
    async getCanceledPurchases(req, res) {
        try {
            const user = req.user;
            const canceledPurchases = await getUserCanceledOrders(user.id);
            res.status(200).json(canceledPurchases);
        } catch (error) {
            console.error('Error getting canceled purchases', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // [GET] /user/fail_delivey_purchases
    async getFailDeliveryPurchases(req, res) {
        try {
            const user = req.user;
            const failDeliveryPurchases = await getUserFailDeliveryOrders(user.id);
            res.status(200).json(failDeliveryPurchases);
        } catch (error) {
            console.error('Error getting fail delivery purchases', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async getUserInfo(req, res) {
        try {
            const user = req.user;
            const user_info = await getUserInfo(user.id);
            res.status(200).json(user_info);
        } catch (error) {
            console.error('Error getting user name', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async updateUserInfo(req, res) {
        try {
            const user = req.user;
            const { Name } = req.body;
            let { Avatar } = req.body;

            // 1. Get old avatar filename before update
            const userInfo = await getUserInfo(user.id);
            const oldAvatar = userInfo.Avatar;

            if (req.file) {
                Avatar = req.file.filename;
            }

            await updateUserInfo({ userId: user.id, Name, Avatar });

            // 2. Delete old avatar file if changed and not empty
            if (req.file && oldAvatar && oldAvatar !== Avatar && oldAvatar !== 'default_avatar.jpg') {
                const fs = require('fs');
                const path = require('path');
                const avatarPath = path.join(__dirname, '../../../src/uploads/images/userAvatar', oldAvatar);
                fs.unlink(avatarPath, (err) => {
                    if (err) console.error('Failed to delete old user avatar:', err);
                });
            }

            res.status(200).json({ message: 'User information updated', Avatar });
        } catch (error) {
            console.error('Error updating user information', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
}

module.exports = new UserController();
