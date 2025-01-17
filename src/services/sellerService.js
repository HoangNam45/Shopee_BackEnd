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

const createDiscount = async ({ discountData }) => {
    const request = await getRequest();
    await request
        .input('ProductId', sql.Int, discountData.productId)
        .input('Discount', sql.Int, discountData.discountPercentage)
        .input('StartDate', sql.DateTime, discountData.startDate)
        .input('EndDate', sql.DateTime, discountData.endDate)
        .query(
            'INSERT INTO Discount (Product_id, Discount_percentage, Start_date, End_date) VALUES (@ProductId, @Discount, @StartDate, @EndDate)',
        );
    return;
};

module.exports = { createSeller, getSellerByUserId, updateSellerInfo, getSellerById, createDiscount };
