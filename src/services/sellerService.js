const { poolPromise, sql } = require('../config/db/index');

const createSeller = async ({ name, userId, transaction }) => {
    try {
        const request = transaction.request();
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
    const request = transaction ? transaction.request() : (await poolPromise).request();
    const result = await request.input('UserId', sql.Int, userId).query('SELECT * FROM Sellers Where UserId = @UserId');
    return result.recordset[0];
};

const getSellerById = async (sellerId, transaction = null) => {
    const request = transaction ? transaction.request() : (await poolPromise).request();

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
module.exports = { createSeller, getSellerByUserId, updateSellerInfo, getSellerById };
