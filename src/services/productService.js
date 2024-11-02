const { sql, poolPromise } = require('../config/db/index');
const { v4: uuidv4 } = require('uuid');
const { getRequest } = require('../utils/dbHelper');

const createProductUniqueSlug = async ({ baseSlug, transaction }) => {
    const request = await getRequest(transaction);
    let uniqueSlug = baseSlug;
    const uniqueId = uuidv4();

    const result = await request
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
    productStatus,
    transaction = null,
}) => {
    const request = await getRequest(transaction);
    const result = await request
        .input('SellerId', sql.Int, sellerId)
        .input('BackGround', sql.NVarChar, productBackGroundImage[0]?.filename || null)
        .input('Name', sql.NVarChar, productName)
        .input('Slug', sql.NVarChar, slug)
        .input('Description', sql.NVarChar, productDescription)
        .input('Price', sql.Float, productPrice)
        .input('Stock', sql.Int, productStock)
        .input('SKU', sql.NVarChar, productSKU)
        .input('Status', sql.NVarChar, productStatus)
        .query(
            'INSERT INTO Products (SellerId,BackGround, Name, Slug,Description, Price, Stock, SKU, Status) OUTPUT INSERTED.Id VALUES (@SellerId, @BackGround, @Name, @Slug,@Description, @Price, @Stock, @SKU, @Status)',
        );
    return result.recordset[0];
};

const updateProduct = async ({
    sellerId,
    productId,
    slug,
    productName,
    productDescription,
    productPrice,
    productStock,
    productSKU,
    updatedProductBackGroundImage,
    productStatus,
    transaction = null,
}) => {
    const request = await getRequest(transaction);
    const result = await request
        .input('SellerId', sql.Int, sellerId)
        .input('ProductId', sql.Int, productId)
        .input('BackGround', sql.NVarChar, updatedProductBackGroundImage)
        .input('Name', sql.NVarChar, productName)
        .input('Slug', sql.NVarChar, slug)
        .input('Description', sql.NVarChar, productDescription)
        .input('Price', sql.Float, productPrice)
        .input('Stock', sql.Int, productStock)
        .input('SKU', sql.NVarChar, productSKU)
        .query(
            'UPDATE Products SET Name = @Name, Description = @Description, Price = @Price, Stock = @Stock, SKU = @SKU, BackGround = @BackGround WHERE Id = @ProductId',
        );
    return;
};

const updateProductStatus = async ({ productId, productStatus, transaction }) => {
    const request = await getRequest(transaction);
    const result = await request
        .input('ProductId', sql.Int, productId)
        .input('Status', sql.NVarChar, productStatus)
        .query('UPDATE Products SET Status = @Status WHERE Id = @ProductId');
    return;
};

const insertProductImages = async (productId, image, transaction = null) => {
    const request = await getRequest(transaction);
    await request
        .input('ProductId', sql.Int, productId)
        .input('ImageUrl', sql.NVarChar, image)
        .query('INSERT INTO ProductImages (ProductId, ImageUrl) VALUES (@ProductId, @ImageUrl)');
    return;
};

const insertProductPriceRanges = async ({ productId, priceRange, transaction = null }) => {
    const request = await getRequest(transaction);
    await request
        .input('ProductId', sql.Int, productId)
        .input('StartRange', sql.Int, priceRange.from)
        .input('EndRange', sql.Int, priceRange.to)
        .input('SpecificPrice', sql.Float, priceRange.price)
        .query(
            'INSERT INTO ProductPriceRanges (ProductId, StartRange, EndRange, SpecificPrice) VALUES (@ProductId, @StartRange, @EndRange, @SpecificPrice)',
        );
    return;
};

const getLatestProducts = async () => {
    const pool = await poolPromise;
    const request = pool.request();
    const result = await request.query('SELECT * FROM Products ORDER BY CreatedAt DESC');
    return result.recordset;
};

const getProductDetail = async ({ slug, transaction = null }) => {
    const request = await getRequest(transaction);
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

const getSellerLatestProduct = async ({ sellerId, offset, limit, transaction }) => {
    const request = await getRequest(transaction);

    const result = await request
        .input('SellerId', sql.Int, sellerId)
        .input('Offset', sql.Int, offset)
        .input('Limit', sql.Int, limit)

        .query(
            'Select * From Products WHERE SellerId = @SellerId ORDER BY CreatedAt DESC OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY',
        );
    return result.recordset;
};

const getSellerActiveProduct = async ({ sellerId, offset, limit, transaction }) => {
    const request = await getRequest(transaction);

    const result = await request
        .input('SellerId', sql.Int, sellerId)
        .input('Offset', sql.Int, offset)
        .input('Limit', sql.Int, limit)

        .query(
            "Select * From Products WHERE SellerId = @SellerId AND Status='active' ORDER BY CreatedAt DESC OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY",
        );
    return result.recordset;
};

const getSellerHiddenProduct = async ({ sellerId, offset, limit, transaction }) => {
    const request = await getRequest(transaction);

    const result = await request
        .input('SellerId', sql.Int, sellerId)
        .input('Offset', sql.Int, offset)
        .input('Limit', sql.Int, limit)

        .query(
            "Select * From Products WHERE SellerId = @SellerId AND Status='hidden' ORDER BY CreatedAt DESC OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY",
        );
    return result.recordset;
};

const getSellerTotalProducts = async ({ sellerId, transaction }) => {
    const request = await getRequest(transaction);

    const result = await request
        .input('SellerId', sql.Int, sellerId)
        .query('SELECT COUNT(*) AS TotalProducts FROM Products WHERE SellerId = @SellerId');
    return result.recordset[0].TotalProducts;
};

const getSellerTotalActiveProducts = async ({ sellerId, transaction }) => {
    const request = await getRequest(transaction);

    const result = await request
        .input('SellerId', sql.Int, sellerId)
        .query("SELECT COUNT(*) AS totalActiveProducts FROM Products WHERE SellerId = @SellerId AND Status = 'active'");
    return result.recordset[0].totalActiveProducts;
};

const getSellerTotalHiddenProducts = async ({ sellerId, transaction }) => {
    const request = await getRequest(transaction);

    const result = await request
        .input('SellerId', sql.Int, sellerId)
        .query("SELECT COUNT(*) AS totalHiddenProducts FROM Products WHERE SellerId = @SellerId AND Status = 'hidden'");
    return result.recordset[0].totalHiddenProducts;
};

const deleteProductById = async (productId, transaction) => {
    const request = await getRequest(transaction);
    const result = await request
        .input('ProductId', sql.Int, productId)
        .query('DELETE FROM Products WHERE Id = @ProductId');
    return;
};

const getSellerDetailProduct = async ({ sellerId, productId, transaction }) => {
    const request = await getRequest(transaction);

    const result = await request.input('SellerId', sql.Int, sellerId).input('ProductId', sql.Int, productId).query(`
    SELECT 
        p.*, 
        i.ImageUrl
    FROM 
        Products p
    INNER JOIN 
        ProductImages i ON p.Id = i.ProductId
    WHERE 
        p.Id = @ProductId
`);

    return result.recordset;
};

const deleteProductImagesById = async ({ productId, transaction }) => {
    const request = await getRequest(transaction);
    const result = await request
        .input('ProductId', sql.Int, productId)
        .query('DELETE FROM ProductImages WHERE ProductId = @ProductId');
    return;
};

const getProductsBySearch = async ({ query, transaction }) => {
    const request = await getRequest(transaction);
    const result = await request
        .input('query', sql.NVarChar, query)
        .query(`SELECT * FROM Products WHERE Name LIKE '%@Search%'`);
    return result.recordset;
};
module.exports = {
    createProductUniqueSlug,
    createNewProduct,
    updateProduct,
    insertProductImages,
    insertProductPriceRanges,
    getLatestProducts,
    getProductDetail,
    getSellerLatestProduct,
    getSellerTotalProducts,
    getSellerTotalActiveProducts,
    getSellerActiveProduct,
    getSellerTotalHiddenProducts,
    getSellerHiddenProduct,
    getSellerDetailProduct,
    deleteProductImagesById,
    updateProductStatus,
    deleteProductById,
    getProductsBySearch,
};
