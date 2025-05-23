const { sql, poolPromise } = require('../config/db/index');
const bcrypt = require('bcryptjs');
const { getRequest } = require('../utils/dbHelper');

const createUser = async ({ account, password, transaction = null }) => {
    const request = await getRequest(transaction);

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const userResult = await request
            .input('account', sql.VarChar, account)
            .input('password', sql.VarChar, hashedPassword)
            .input('name', sql.VarChar, account)
            .input('avatar', sql.VarChar, 'default_avatar.jpg')
            .input('created_at', sql.DateTime, new Date())
            .query(
                'INSERT INTO Users (Account, Password, Name, Avatar, Created_At) OUTPUT INSERTED.Id VALUES (@account, @password, @name, @avatar, @created_at)',
            );
        const userId = userResult.recordset[0].Id;
        // Insert into Sellers table

        return userId;
    } catch (err) {
        console.error('Error registering user', err);
        throw err;
    }
};

const getUserByAccount = async (account, transaction = null) => {
    try {
        const request = await getRequest(transaction);
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

const getUserCart = async (userId, transaction = null) => {
    const request = await getRequest(transaction);
    const result = await request.input('userId', sql.Int, userId).query('SELECT * FROM Carts WHERE user_id = @userId');
    return result.recordset[0];
};

const getUserCartItems = async (cart_id) => {
    const request = await getRequest();
    const result = await request.input('cartId', sql.Int, cart_id).query(`
        SELECT 
    p.Id,
    p.Name, 
    p.Description, 
    p.Price AS Original_price, 
    p.Stock,
    p.SellerId,
	p.BackGround,
	ci.quantity,
	ci.cart_id,
    COALESCE(d.Discount_percentage, 0) AS Discount_percentage,
    CASE 
        WHEN d.Discount_percentage IS NOT NULL THEN 
            p.price - (p.price * d.Discount_percentage / 100)
        ELSE 
            p.price
    END AS Final_price
FROM 
    Products p
LEFT JOIN (
    SELECT 
        Product_id, 
        Discount_percentage
    FROM 
        Discount
    WHERE 
        GETUTCDATE() BETWEEN Start_date AND End_date
)  d
ON 
    p.Id = d.Product_id
 JOIN CartItems ci
ON ci.product_id=p.Id  AND ci.cart_id=@cartId
    `);
    return result.recordset;
};

const deleteUserCartItem = async ({ cart_id, product_id, transaction }) => {
    const request = await getRequest(transaction);
    await request
        .input('cart_id', sql.Int, cart_id)
        .input('product_id', sql.Int, product_id)
        .query('DELETE FROM CartItems WHERE cart_id = @cart_id AND product_id = @product_id');
    return;
};

const createOrder = async ({ user_id, name, phoneNumber, address, total_price, transaction }) => {
    const request = await getRequest(transaction);
    const result = await request
        .input('user_id', sql.Int, user_id)
        .input('name', sql.NVarChar, name)
        .input('phone', sql.VarChar, phoneNumber)
        .input('address', sql.NVarChar, address)
        .input('total_price', sql.Int, total_price)
        .query(
            "INSERT INTO Orders (user_id, name, phone, address, total_price, status) OUTPUT INSERTED.order_id VALUES (@user_id, @name, @phone, @address, @total_price, 'Pending')",
        );
    return result.recordset[0].order_id;
};

const createOrderDetail = async ({ order_id, product_id, quantity, price, transaction }) => {
    const request = await getRequest(transaction);
    const result = await request
        .input('order_id', sql.Int, order_id)
        .input('product_id', sql.Int, product_id)
        .input('quantity', sql.Int, quantity)
        .input('price', sql.Int, price)
        .query(
            'INSERT INTO Order_Items(order_id, product_id, quantity, price) VALUES (@order_id, @product_id, @quantity, @price)',
        );
    return;
};

const getUserPendingOrders = async (userId) => {
    const request = await getRequest();
    const result = await request.input('userId', sql.Int, userId).query(`
            SELECT oi.order_item_id, o.status, oi.quantity, oi.price, oi.order_id, p.BackGround, p.Name, s.Name AS sellerName, s.Avatar FROM Orders o 
            JOIN Order_Items oi 
            ON oi.order_id=o.order_id 
            JOIN Products p
            ON oi.product_id= p.Id
            JOIN Sellers s
            ON s.Id=p.SellerId
            WHERE user_id = @userId AND o.status = 'Pending'
            ORDER BY o.created_at DESC
`);
    return result.recordset;
};

const getUserShippingOrders = async (userId) => {
    const request = await getRequest();
    const result = await request.input('userId', sql.Int, userId).query(`
            SELECT oi.order_item_id, o.status, oi.quantity, oi.price, oi.order_id, p.BackGround, p.Name, s.Name AS sellerName, s.Avatar FROM Orders o 
            JOIN Order_Items oi 
            ON oi.order_id=o.order_id 
            JOIN Products p
            ON oi.product_id= p.Id
            JOIN Sellers s
            ON s.Id=p.SellerId
            WHERE user_id = @userId AND o.status = 'Shipping'
            ORDER BY o.created_at DESC
`);
    return result.recordset;
};

const getUserCompletedOrders = async (userId) => {
    const request = await getRequest();
    const result = await request.input('userId', sql.Int, userId).query(`
            SELECT oi.order_item_id, o.status, oi.quantity, oi.price, oi.order_id, p.BackGround, p.Name, s.Name AS sellerName, s.Avatar FROM Orders o 
            JOIN Order_Items oi 
            ON oi.order_id=o.order_id 
            JOIN Products p
            ON oi.product_id= p.Id
            JOIN Sellers s
            ON s.Id=p.SellerId
            WHERE user_id = @userId AND o.status = 'Completed'
            ORDER BY o.created_at DESC
`);
    return result.recordset;
};

const getUserCanceledOrders = async (userId) => {
    const request = await getRequest();
    const result = await request.input('userId', sql.Int, userId).query(`
            SELECT oi.order_item_id, o.status, oi.quantity, oi.price, oi.order_id, p.BackGround, p.Name, s.Name AS sellerName, s.Avatar FROM Orders o 
            JOIN Order_Items oi 
            ON oi.order_id=o.order_id 
            JOIN Products p
            ON oi.product_id= p.Id
            JOIN Sellers s
            ON s.Id=p.SellerId
            WHERE user_id = @userId AND o.status = 'Canceled'
            ORDER BY o.created_at DESC
`);
    return result.recordset;
};

const getUserFailDeliveryOrders = async (userId) => {
    const request = await getRequest();
    const result = await request.input('userId', sql.Int, userId).query(`
            SELECT oi.order_item_id, o.status, oi.quantity, oi.price, oi.order_id, p.BackGround, p.Name, s.Name AS sellerName, s.Avatar FROM Orders o 
            JOIN Order_Items oi 
            ON oi.order_id=o.order_id 
            JOIN Products p
            ON oi.product_id= p.Id
            JOIN Sellers s
            ON s.Id=p.SellerId
            WHERE user_id = @userId AND o.status = 'Failed Delivery'
            ORDER BY o.created_at DESC
`);
    return result.recordset;
};

const getUserAllOrders = async (userId) => {
    const request = await getRequest();
    const result = await request.input('userId', sql.Int, userId).query(`
            SELECT oi.order_item_id, o.status, oi.quantity, oi.price, oi.order_id, p.BackGround, p.Name, s.Name AS sellerName, s.Avatar, s.Id as sellerId FROM Orders o 
            JOIN Order_Items oi 
            ON oi.order_id=o.order_id 
            JOIN Products p
            ON oi.product_id= p.Id
            JOIN Sellers s
            ON s.Id=p.SellerId
            WHERE user_id = @userId
            ORDER BY o.created_at DESC
`);
    return result.recordset;
};

const getUserInfo = async (userId) => {
    const request = await getRequest();
    const result = await request
        .input('userId', sql.Int, userId)
        .query('SELECT Name, Avatar, Account FROM Users WHERE Id = @userId');
    return result.recordset[0];
};

const updateUserInfo = async ({ userId, Name, Avatar }) => {
    const request = await getRequest();
    await request
        .input('userId', sql.Int, userId)
        .input('Name', sql.NVarChar, Name)
        .input('Avatar', sql.VarChar, Avatar)
        .query('UPDATE Users SET Name = @Name, Avatar = @Avatar WHERE Id = @userId');
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
};
