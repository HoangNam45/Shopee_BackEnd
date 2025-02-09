const { poolPromise, sql } = require('../config/db/index');
const { getRequest } = require('../utils/dbHelper');

const createSeller = async ({ name, userId, transaction = null }) => {
    try {
        const request = await getRequest(transaction);
        await request
            .input('Name', sql.VarChar, name)
            .input('UserId', sql.Int, userId)
            .query('INSERT INTO Sellers (Name, UserId) VALUES (@Name, @UserId)');
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
            SELECT oi.order_item_id,u.Account, p.BackGround, p.Name, oi.quantity, oi.price, o.name, o.address, o.phone, o.status FROM Sellers s
                JOIN Products p
                ON s.Id=p.SellerId
                JOIN Order_Items oi
                ON p.Id=oi.product_id
                JOIN Orders o
                ON o.order_id=oi.order_id
                JOIN Users u
                ON u.Id=o.user_id
                WHERE s.Id=@SellerId AND o.status='Pending'
        `);
    return result.recordset;
};

module.exports = { createSeller, getSellerByUserId, updateSellerInfo, getSellerById, getSellerPendingOrders };
