const { poolPromise, sql } = require('../config/db/index');
const { getRequest } = require('../utils/dbHelper');

const createSeller = async ({ name, userId, transaction = null }) => {
    try {
        const request = await getRequest(transaction);
        await request
            .input('Name', sql.VarChar, name)
            .input('UserId', sql.Int, userId)
            .input('created_at', sql.DateTime, new Date())
            .query('INSERT INTO Sellers (Name, UserId, Created_At) VALUES (@Name, @UserId, @created_at)');
    } catch (err) {
        console.error('Error inserting seller', err);
        throw err;
    }
};

const getSellerByUserId = async ({ userId, transaction = null }) => {
    const request = await getRequest(transaction);
    const result = await request.input('UserId', sql.Int, userId).query('SELECT * FROM Sellers Where UserId = @UserId');
    return result.recordset[0];
};

const getSellerById = async (sellerId, transaction = null) => {
    const request = await getRequest(transaction);

    const result = await request
        .input('SellerId', sql.Int, sellerId)
        .query('SELECT * FROM Sellers WHERE Id = @SellerId');
    return result.recordset[0];
};

const updateSellerInfo = async ({ userId, shopName, avatar }) => {
    const pool = await poolPromise;
    const request = pool.request();
    request.input('UserId', sql.Int, userId);
    request.input('Name', sql.NVarChar, shopName);
    request.input('Avatar', sql.NVarChar, avatar);

    const result = await request.query(`
                UPDATE Sellers
                SET 
                    Name = COALESCE(@Name, Name), 
                    Avatar = COALESCE(@Avatar, Avatar)
                OUTPUT inserted.Name, inserted.Avatar
                WHERE UserId = @UserId
            `);
    return result.recordset[0];
};

const getSellerPendingOrders = async ({ sellerId }) => {
    const request = await getRequest();
    const result = await request.input('SellerId', sql.Int, sellerId).query(`
            SELECT 
            o.order_id,
            o.name AS order_name,
            o.address,
            o.phone,
            o.status,
            o.created_at,
            o.total_price,
            u.Account AS customer,
            JSON_QUERY((
                SELECT 
                    oi.order_item_id,
                    p.BackGround,
                    p.Name AS ProductName,
                    p.Id AS ProductId,
                    oi.quantity,
                    oi.price
                FROM Order_Items oi
                JOIN Products p ON oi.product_id = p.Id
                WHERE oi.order_id = o.order_id
                FOR JSON PATH
            )) AS order_items
        FROM Orders o
        JOIN Users u ON o.user_id = u.Id
        JOIN Order_Items oi ON o.order_id = oi.order_id
        JOIN Products p ON oi.product_id = p.Id
        JOIN Sellers s ON p.SellerId = s.Id
        WHERE s.Id = @SellerId AND o.status = 'Pending'
        GROUP BY 
            o.order_id,
            o.name,
            o.address,
            o.phone,
            o.status,
            o.created_at,
            o.total_price,
            u.Account
        ORDER BY o.created_at DESC
        `);

    const orders = result.recordset.map((order) => ({
        ...order,
        order_items: JSON.parse(order.order_items),
    }));
    return orders;
};

const getSellerAllOrders = async ({ sellerId }) => {
    const request = await getRequest();
    const result = await request.input('SellerId', sql.Int, sellerId).query(`
           SELECT 
            o.order_id,
            o.name AS order_name,
            o.address,
            o.phone,
            o.status,
            o.created_at,
            o.total_price,
            u.Account AS customer,
            JSON_QUERY((
                SELECT 
                    oi.order_item_id,
                    p.BackGround,
                    p.Name AS ProductName,
                    p.Id AS ProductId,
                    oi.quantity,
                    oi.price
                FROM Order_Items oi
                JOIN Products p ON oi.product_id = p.Id
                WHERE oi.order_id = o.order_id
                FOR JSON PATH
            )) AS order_items
        FROM Orders o
        JOIN Users u ON o.user_id = u.Id
        JOIN Order_Items oi ON o.order_id = oi.order_id
        JOIN Products p ON oi.product_id = p.Id
        JOIN Sellers s ON p.SellerId = s.Id
        WHERE s.Id = @SellerId
        GROUP BY 
            o.order_id,
            o.name,
            o.address,
            o.phone,
            o.status,
            o.created_at,
            o.total_price,  
            u.Account
        ORDER BY o.created_at DESC
        `);
    const orders = result.recordset.map((order) => ({
        ...order,
        order_items: JSON.parse(order.order_items),
    }));
    return orders;
};

const getSellerShippingOrders = async ({ sellerId }) => {
    const request = await getRequest();
    const result = await request.input('SellerId', sql.Int, sellerId).query(`
            SELECT 
            o.order_id,
            o.name AS order_name,
            o.address,
            o.phone,
            o.status,
            o.created_at,
            o.total_price,  
            u.Account AS customer,
            JSON_QUERY((
                SELECT 
                    oi.order_item_id,
                    p.BackGround,
                    p.Name AS ProductName,
                    p.Id AS ProductId,
                    oi.quantity,
                    oi.price
                FROM Order_Items oi
                JOIN Products p ON oi.product_id = p.Id
                WHERE oi.order_id = o.order_id
                FOR JSON PATH
            )) AS order_items
        FROM Orders o
        JOIN Users u ON o.user_id = u.Id
        JOIN Order_Items oi ON o.order_id = oi.order_id
        JOIN Products p ON oi.product_id = p.Id
        JOIN Sellers s ON p.SellerId = s.Id
        WHERE s.Id = @SellerId AND o.status = 'Shipping'
        GROUP BY 
            o.order_id,
            o.name,
            o.address,
            o.phone,
            o.status,
            o.created_at,
            o.total_price,  
            u.Account
        ORDER BY o.created_at DESC
        `);

    const orders = result.recordset.map((order) => ({
        ...order,
        order_items: JSON.parse(order.order_items),
    }));
    return orders;
};

const getSellerCanceledOrders = async ({ sellerId }) => {
    const request = await getRequest();
    const result = await request.input('SellerId', sql.Int, sellerId).query(`
            SELECT 
            o.order_id,
            o.name AS order_name,
            o.address,
            o.phone,
            o.status,
            o.created_at,
            o.total_price,  
            u.Account AS customer,
            JSON_QUERY((
                SELECT 
                    oi.order_item_id,
                    p.BackGround,
                    p.Name AS ProductName,
                    p.Id AS ProductId,
                    oi.quantity,
                    oi.price
                FROM Order_Items oi
                JOIN Products p ON oi.product_id = p.Id
                WHERE oi.order_id = o.order_id
                FOR JSON PATH
            )) AS order_items
        FROM Orders o
        JOIN Users u ON o.user_id = u.Id
        JOIN Order_Items oi ON o.order_id = oi.order_id
        JOIN Products p ON oi.product_id = p.Id
        JOIN Sellers s ON p.SellerId = s.Id
        WHERE s.Id = @SellerId AND o.status = 'Canceled'
        GROUP BY 
            o.order_id,
            o.name,
            o.address,
            o.phone,
            o.status,
            o.created_at,
            o.total_price,  
            u.Account
        ORDER BY o.created_at DESC
        `);

    const orders = result.recordset.map((order) => ({
        ...order,
        order_items: JSON.parse(order.order_items),
    }));
    return orders;
};

const getSellerCompletedOrders = async ({ sellerId }) => {
    const request = await getRequest();
    const result = await request.input('SellerId', sql.Int, sellerId).query(`
            SELECT 
            o.order_id,
            o.name AS order_name,
            o.address,
            o.phone,
            o.status,
            o.created_at,
            o.total_price,  
            u.Account AS customer,
            JSON_QUERY((
                SELECT 
                    oi.order_item_id,
                    p.BackGround,
                    p.Name AS ProductName,
                    p.Id AS ProductId,
                    oi.quantity,
                    oi.price
                FROM Order_Items oi
                JOIN Products p ON oi.product_id = p.Id
                WHERE oi.order_id = o.order_id
                FOR JSON PATH
            )) AS order_items
        FROM Orders o
        JOIN Users u ON o.user_id = u.Id
        JOIN Order_Items oi ON o.order_id = oi.order_id
        JOIN Products p ON oi.product_id = p.Id
        JOIN Sellers s ON p.SellerId = s.Id
        WHERE s.Id = @SellerId AND o.status = 'Completed'
        GROUP BY 
            o.order_id,
            o.name,
            o.address,
            o.phone,
            o.status,
            o.created_at,
            o.total_price,  
            u.Account
        ORDER BY o.created_at DESC
        `);

    const orders = result.recordset.map((order) => ({
        ...order,
        order_items: JSON.parse(order.order_items),
    }));
    return orders;
};

const getSellerFailedDeliveryOrders = async ({ sellerId }) => {
    const request = await getRequest();
    const result = await request.input('SellerId', sql.Int, sellerId).query(`
            SELECT 
            o.order_id,
            o.name AS order_name,
            o.address,
            o.phone,
            o.status,
            o.created_at,
            o.total_price,  
            u.Account AS customer,
            JSON_QUERY((
                SELECT 
                    oi.order_item_id,
                    p.BackGround,
                    p.Name AS ProductName,
                    p.Id AS ProductId,
                    oi.quantity,
                    oi.price
                FROM Order_Items oi
                JOIN Products p ON oi.product_id = p.Id
                WHERE oi.order_id = o.order_id
                FOR JSON PATH
            )) AS order_items
        FROM Orders o
        JOIN Users u ON o.user_id = u.Id
        JOIN Order_Items oi ON o.order_id = oi.order_id
        JOIN Products p ON oi.product_id = p.Id
        JOIN Sellers s ON p.SellerId = s.Id
        WHERE s.Id = @SellerId AND o.status = 'Failed Delivery'
        GROUP BY 
            o.order_id,
            o.name,
            o.address,
            o.phone,
            o.status,
            o.created_at,
            o.total_price,  
            u.Account
        ORDER BY o.created_at DESC
        `);

    const orders = result.recordset.map((order) => ({
        ...order,
        order_items: JSON.parse(order.order_items),
    }));
    return orders;
};

const updateOrderStatus = async ({ orderId, status }) => {
    const request = await getRequest();
    const result = await request
        .input('OrderId', sql.Int, orderId)
        .input('Status', sql.NVarChar, status)
        .query('UPDATE Orders SET Status = @Status WHERE order_id = @OrderId');
    return;
};

module.exports = {
    createSeller,
    getSellerByUserId,
    updateSellerInfo,
    getSellerById,
    getSellerPendingOrders,
    getSellerAllOrders,
    getSellerShippingOrders,
    getSellerCanceledOrders,
    getSellerCompletedOrders,
    getSellerFailedDeliveryOrders,
    updateOrderStatus,
};
