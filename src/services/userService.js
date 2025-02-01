const { sql, poolPromise } = require('../config/db/index');
const bcrypt = require('bcrypt');
const { getRequest } = require('../utils/dbHelper');

const createUser = async ({ account, password, transaction = null }) => {
    const request = await getRequest(transaction);

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const userResult = await request
            .input('account', sql.VarChar, account)
            .input('password', sql.VarChar, hashedPassword)
            .query('INSERT INTO Users (Account, Password) OUTPUT INSERTED.Id VALUES (@account, @password)');
        const userId = userResult.recordset[0].Id;
        // Insert into Sellers table

        return userId;
    } catch (err) {
        console.error('Error registering user', err);

        throw err;
    }
};

const getUserByAccount = async (account) => {
    try {
        const pool = await poolPromise;
        const request = pool.request();
        request.input('account', sql.VarChar, account);
        const result = await request.query('SELECT * FROM Users WHERE Account = @account');
        return result.recordset[0];
    } catch (err) {
        console.error('Error getting user by account', err);
        throw err;
    }
};

const createUserCart = async ({ userId, transaction }) => {
    const request = await getRequest(transaction);

    const result = await request
        .input('UserId', sql.Int, userId)
        .query('INSERT INTO Carts (user_id, total_price) VALUES (@UserId, 0);');
    return;
};

const addProductToCard = async ({ cart_id, product_id, quantity }) => {
    const request = await getRequest();
    const result = await request
        .input('cart_id', sql.Int, cart_id)
        .input('product_id', sql.Int, product_id)
        .input('quantity', sql.Int, quantity)

        .query('INSERT INTO CartItems (cart_id, product_id, quantity) VALUES (@cart_id, @product_id, @quantity);');
    return;
};

const checkProductInCart = async ({ cart_id, product_id }) => {
    const request = await getRequest();
    const result = await request
        .input('cart_id', sql.Int, cart_id)
        .input('product_id', sql.Int, product_id)
        .query('SELECT quantity FROM CartItems WHERE cart_id = @cart_id AND product_id = @product_id');
    return result.recordset[0];
};

const updateProductQuantityInCart = async ({ cart_id, product_id, newQuantity }) => {
    const request = await getRequest();
    await request
        .input('cart_id', sql.Int, cart_id)
        .input('product_id', sql.Int, product_id)
        .input('quantity', sql.Int, newQuantity)
        .query('UPDATE CartItems SET quantity = @quantity WHERE cart_id = @cart_id AND product_id = @product_id');
};

const getUserCart = async (userId) => {
    const request = await getRequest();
    const result = await request.input('userId', sql.Int, userId).query('SELECT * FROM Carts WHERE user_id = @userId');
    return result.recordset[0];
};

const getUserCartItems = async (cart_id) => {
    const request = await getRequest();
    const result = await request.input('cartId', sql.Int, cart_id).query(`
        SELECT p.Id,p.BackGround, p.Name, p.Stock, ci.quantity, ci.cart_id FROM Products p
        JOIN CartItems ci
        ON ci.product_id=p.Id AND ci.cart_id=@cartId
    `);
    return result.recordset;
};

module.exports = {
    createUser,
    getUserByAccount,
    addProductToCard,
    createUserCart,
    getUserCart,
    checkProductInCart,
    updateProductQuantityInCart,
    getUserCartItems,
};
