const { sql, poolPromise } = require('../config/db/index');
const { getRequest } = require('../utils/dbHelper');

const createDiscount = async ({ discountData, sellerId }) => {
    const request = await getRequest();
    console.log(sellerId);
    await request
        .input('ProductId', sql.Int, discountData.productId)
        .input('Discount', sql.Int, discountData.discountPercentage)
        .input('StartDate', sql.DateTime, discountData.startDate)
        .input('EndDate', sql.DateTime, discountData.endDate)
        .input('SellerId', sql.Int, sellerId)
        .query(
            'INSERT INTO Discount (Product_id, Discount_percentage, Start_date, End_date, Seller_id) VALUES (@ProductId ,@Discount ,@StartDate, @EndDate, @SellerId)',
        );

    console.log('Test');
    return;
};

const getDiscounts = async ({ productId }) => {
    const request = await getRequest();
    const result = await request
        .input('ProductId', sql.Int, productId)
        .query('SELECT * FROM Discount WHERE Product_id = @ProductId');
    return result.recordset;
};

module.exports = { createDiscount, getDiscounts };
