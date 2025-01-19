const { sql, poolPromise } = require('../config/db/index');
const { get } = require('../routes/discount');
const { getRequest } = require('../utils/dbHelper');

const createDiscount = async ({ discountData, sellerId }) => {
    const request = await getRequest();
    await request
        .input('ProductId', sql.Int, discountData.productId)
        .input('Discount', sql.Int, discountData.discountPercentage)
        .input('StartDate', sql.DateTime, discountData.startDate)
        .input('EndDate', sql.DateTime, discountData.endDate)
        .input('SellerId', sql.Int, sellerId)
        .query(
            'INSERT INTO Discount (Product_id, Discount_percentage, Start_date, End_date, Seller_id) VALUES (@ProductId ,@Discount ,@StartDate, @EndDate, @SellerId)',
        );

    return;
};

const getDiscounts = async ({ productId }) => {
    const request = await getRequest();
    const result = await request
        .input('ProductId', sql.Int, productId)
        .query('SELECT * FROM Discount WHERE Product_id = @ProductId');
    return result.recordset;
};

const getSellerDiscounts = async ({ sellerId, transaction }) => {
    const request = await getRequest(transaction);
    const result = await request
        .input('SellerId', sql.Int, sellerId)
        .query('SELECT * FROM Discount WHERE Seller_id = @SellerId');
    return result.recordset;
};

const getSellerDiscountedProducts = async ({ sellerId, transaction }) => {
    const request = await getRequest(transaction);
    const result = await request
        .input('SellerId', sql.Int, sellerId)
        .query(
            'SELECT  p.Id, p.BackGround, p.Name, p.Price, p.Stock, d.Discount_percentage, d.Start_date, d.End_date, d.Seller_id FROM Products p JOIN Discount d ON p.Id=d.Product_id WHERE p.Id IN (SELECT Product_id FROM Discount WHERE Seller_id = @SellerId)',
        );
    console.log(result.recordset);
    return result.recordset;
};

module.exports = { createDiscount, getDiscounts, getSellerDiscounts, getSellerDiscountedProducts };
