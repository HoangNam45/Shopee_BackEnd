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
    const request = transaction ? transaction.request() : (await poolPromise).request();
    request
        .input('ProductId', sql.Int, productId)
        .input('ImageUrl', sql.NVarChar, image.filename)
        .query('INSERT INTO ProductImages (ProductId, ImageUrl) VALUES (@ProductId, @ImageUrl)');
};

const insertProductPriceRanges = async ({ productId, priceRange, transaction = null }) => {
    const request = transaction ? transaction.request() : (await poolPromise).request();
    request
        .input('ProductId', sql.Int, productId)
        .input('StartRange', sql.Int, priceRange.from)
        .input('EndRange', sql.Int, priceRange.to)
        .input('SpecificPrice', sql.Float, priceRange.price)
        .query(
            'INSERT INTO ProductPriceRanges (ProductId, StartRange, EndRange, SpecificPrice) VALUES (@ProductId, @StartRange, @EndRange, @SpecificPrice)',
        );
};

const getLatestProducts = async () => {
    const pool = await poolPromise;
    const request = pool.request();
    const result = await request.query('SELECT * FROM Products ORDER BY CreatedAt DESC');
    return result.recordset;
};

const getProductDetail = async ({ slug, transaction = null }) => {
    const request = transaction ? transaction.request() : (await poolPromise).request();
    try {
        const result = await request.input('Slug', sql.NVarChar, slug).query(`SELECT 
        Products.Name, 
        Products.Description, 
        Products.Price, 
        Products.Stock,
        Products.SellerId, 
        ProductImages.ImageUrl
        
    FROM 
        Products
    INNER JOIN 
        dbo.ProductImages ON Products.Id = ProductImages.ProductId
    WHERE 
        Products.Slug = @Slug`);
        return result.recordset;
    } catch (error) {
        console.error('Error fetching product detail', error);
        throw new Error('Error fetching product detail');
    }
};
module.exports = {
    createProductUniqueSlug,
    createNewProduct,
    insertProductImages,
    insertProductPriceRanges,
    getLatestProducts,
    getProductDetail,
};
