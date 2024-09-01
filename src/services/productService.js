const { sql, poolPromise } = require('../config/db/index');
const { v4: uuidv4 } = require('uuid');

const createProductUniqueSlug = async (baseSlug) => {
    const pool = await poolPromise;
    let uniqueSlug = baseSlug;
    const uniqueId = uuidv4();

    const result = await pool
        .request()
        .input('Slug', sql.NVarChar, uniqueSlug)
        .query('SELECT COUNT(*) AS Count FROM Products WHERE Slug = @Slug');

    if (result.recordset[0].Count === 0) {
        // Slug chưa tồn tại
        return uniqueSlug;
    }

    // Slug đã tồn tại, tạo slug mới với số định danh
    else {
        uniqueSlug = `${baseSlug}-${uniqueId}`;
        return uniqueSlug;
    }
};

const createNewProduct = async ({
    sellerId,
    slug,
    productName,
    productDescription,
    productPrice,
    productStock,
    productSKU,
    productBackGroundImage,
    transaction = null,
}) => {
    const request = transaction ? transaction.request() : (await poolPromise).request();
    const result = await request
        .input('SellerId', sql.Int, sellerId)
        .input('BackGround', sql.NVarChar, productBackGroundImage[0]?.filename || null)
        .input('Name', sql.NVarChar, productName)
        .input('Slug', sql.NVarChar, slug)
        .input('Description', sql.NVarChar, productDescription)
        .input('Price', sql.Float, productPrice)
        .input('Stock', sql.Int, productStock)
        .input('SKU', sql.NVarChar, productSKU)
        .query(
            'INSERT INTO Products (SellerId,BackGround, Name, Slug,Description, Price, Stock, SKU) OUTPUT INSERTED.Id VALUES (@SellerId, @BackGround, @Name, @Slug,@Description, @Price, @Stock, @SKU)',
        );
    return result.recordset[0];
};

const insertProductImages = async ({ productId, image, transaction }) => {
    for (const image of productImages) {
        await transaction
            .request()
            .input('ProductId', sql.Int, productId)
            .input('ImageUrl', sql.NVarChar, image.filename)
            .query('INSERT INTO ProductImages (ProductId, ImageUrl) VALUES (@ProductId, @ImageUrl)');
    }
};
module.exports = { createProductUniqueSlug, createNewProduct, insertProductImages };
