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
        .input('Status', sql.NVarChar, productStatus)
        .query(
            'INSERT INTO Products (SellerId,BackGround, Name, Slug,Description, Price, Stock, Status) OUTPUT INSERTED.Id VALUES (@SellerId, @BackGround, @Name, @Slug,@Description, @Price, @Stock, @Status)',
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
        .query(
            'UPDATE Products SET Name = @Name, Description = @Description, Price = @Price, Stock = @Stock, BackGround = @BackGround WHERE Id = @ProductId',
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

const getLatestProducts = async ({ page = 1, limit = 10 }) => {
    const offset = (page - 1) * limit; // Calculate the offset
    const pool = await poolPromise;
    const request = pool.request();
    const result = await request.input('Limit', sql.Int, limit).input('Offset', sql.Int, offset).query(`
            SELECT 
                p.Id,
                p.Name,
                p.BackGround,
                p.Slug,
                p.Sold,
                p.Price AS Original_price,
                COALESCE(d.Discount_percentage, 0) AS Discount_percentage,
                CASE 
                    WHEN d.Discount_percentage IS NOT NULL THEN 
                        p.Price - (p.Price * d.Discount_percentage / 100)
                    ELSE 
                        p.Price
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
            ) d
            ON 
                p.Id = d.Product_id
            WHERE 
                p.Status = 'active'    
            ORDER BY 
                p.CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
        `);
    return result.recordset;
};

const getProductDetail = async ({ slug, transaction = null }) => {
    const request = await getRequest(transaction);
    try {
        const result = await request.input('Slug', sql.NVarChar, slug).query(`SELECT 
    p.Id,
    p.Name, 
    p.Description, 
    p.Price AS Original_price, 
    p.Stock,
    p.SellerId, 
    p.BackGround,
    p.Sold,
    ProductImages.ImageUrl,
    COALESCE(d.Discount_percentage, 0) AS Discount_percentage,
    CASE 
        WHEN d.Discount_percentage IS NOT NULL THEN 
            p.price - (p.price * d.Discount_percentage / 100)
        ELSE 
            p.price
    END AS Final_price
FROM 
    Products p
LEFT JOIN 
    dbo.ProductImages 
ON 
    p.Id = ProductImages.ProductId
LEFT JOIN (
    SELECT 
        Product_id, 
        Discount_percentage
    FROM 
        Discount
    WHERE 
        GETUTCDATE() BETWEEN Start_date AND End_date
) d
ON 
    p.Id = d.Product_id
WHERE 
    p.Slug = @Slug;`);
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

const deleteCartItemsByProductId = async (productId, transaction = null) => {
    const request = await getRequest(transaction);
    await request.input('ProductId', sql.Int, productId).query('DELETE FROM CartItems WHERE product_id = @ProductId');
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

const deleteDiscountsByProductId = async (productId, transaction = null) => {
    const request = await getRequest(transaction);
    await request.input('ProductId', sql.Int, productId).query('DELETE FROM Discount WHERE Product_id = @ProductId');
};

// const getProductsBySearch = async ({ query, transaction }) => {
//     const request = await getRequest(transaction);
//     const result = await request.input('query', sql.NVarChar, `%${query}%`).query(`SELECT
//     p.Id,
//     p.Name,
//     p.BackGround,
//     p.Slug,
//     p.price AS Original_price,
//     COALESCE(d.Discount_percentage, 0) AS Discount_percentage,
//     CASE
//         WHEN d.Discount_percentage IS NOT NULL THEN
//             p.price - (p.price * d.Discount_percentage / 100)
//         ELSE
//             p.price
//     END AS Final_price
// FROM
//     Products p
// LEFT JOIN (
//     SELECT
//         Product_id,
//         Discount_percentage
//     FROM
//         Discount
//     WHERE
//         GETDATE() BETWEEN Start_date AND End_date
// ) d
// ON
//     p.Id = d.Product_id
// WHERE
//     p.Name LIKE @query`);
//     return result.recordset;
// };

const getProductsBySearch = async ({ query, page = 1, limit = 5, sortBy = 'latest', transaction }) => {
    const offset = (page - 1) * limit;
    const request = await getRequest(transaction);

    // Determine ORDER BY clause
    let orderByClause = 'p.CreatedAt DESC';
    if (sortBy === 'sold') {
        orderByClause = 'p.Sold DESC';
    }

    // Get paginated products
    const productsResult = await request
        .input('query', sql.NVarChar, `%${query}%`)
        .input('Limit', sql.Int, limit)
        .input('Offset', sql.Int, offset).query(`
            SELECT 
                p.Id,
                p.Name,
                p.BackGround,
                p.Slug,
                p.Stock,
                p.Sold,
                p.price AS Original_price,
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
            ) d
            ON 
                p.Id = d.Product_id
            WHERE 
                p.Name LIKE @query
                AND p.Status = 'active'
            ORDER BY ${orderByClause}
            OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
        `);

    // Create a new request for the count query
    const countRequest = await getRequest(transaction);
    const countResult = await countRequest
        .input('query', sql.NVarChar, `%${query}%`)
        .query(`SELECT COUNT(*) AS total FROM Products WHERE Name LIKE @query AND Status = 'active'`);

    return {
        products: productsResult.recordset,
        total: countResult.recordset[0].total,
    };
};

const getProductById = async (productId, transaction) => {
    const request = await getRequest(transaction);
    const result = await request
        .input('ProductId', sql.Int, productId)
        .query('SELECT * FROM Products WHERE Id = @ProductId');
    return result.recordset[0];
};

const updateProductStock = async ({ product_id, quantity, transaction }) => {
    const request = await getRequest(transaction);
    await request
        .input('ProductId', sql.Int, product_id)
        .input('Quantity', sql.Int, quantity)
        .query('UPDATE Products SET Stock = Stock - @Quantity WHERE Id = @ProductId');
    return;
};

const updateProductSold = async ({ productId, quantity, transaction }) => {
    const request = await getRequest(transaction);
    await request
        .input('ProductId', sql.Int, productId)
        .input('Quantity', sql.Int, quantity)
        .query('UPDATE Products SET Sold = Sold + @Quantity WHERE Id = @ProductId');
    return;
};

const updateProductStockAfterOrder = async ({ productId, quantity, transaction }) => {
    const request = await getRequest(transaction);
    await request
        .input('ProductId', sql.Int, productId)
        .input('Quantity', sql.Int, quantity)
        .query('UPDATE Products SET Stock = Stock + @Quantity WHERE Id = @ProductId');
    return;
};

const getTotalProducts = async () => {
    const pool = await poolPromise;
    const request = pool.request();
    const result = await request.query(`
        SELECT COUNT(*) AS TotalProducts
        FROM Products
        WHERE Status = 'active'
    `);
    return result.recordset[0].TotalProducts;
};

const getProductImagesByProductId = async (productId, transaction = null) => {
    const request = await getRequest(transaction);
    const result = await request
        .input('ProductId', sql.Int, productId)
        .query('SELECT ImageUrl FROM ProductImages WHERE ProductId = @ProductId');
    // Return array of filenames
    return result.recordset.map((row) => row.ImageUrl);
};

// Get the background image filename for a product
const getProductBackGroundImageByProductId = async (productId, transaction = null) => {
    const request = await getRequest(transaction);
    const result = await request
        .input('ProductId', sql.Int, productId)
        .query('SELECT BackGround FROM Products WHERE Id = @ProductId');
    // Return filename string or null
    return result.recordset[0]?.BackGround || null;
};

const deleteOrderItemsByProductId = async (productId, transaction = null) => {
    const request = await getRequest(transaction);
    await request.input('ProductId', sql.Int, productId).query('DELETE FROM Order_Items WHERE product_id = @ProductId');
};

const deleteOrdersWithoutItems = async (transaction = null) => {
    const request = await getRequest(transaction);
    // Delete orders that have no items left
    await request.query(`
        DELETE FROM Orders
        WHERE order_id NOT IN (SELECT DISTINCT order_id FROM Order_Items)
    `);
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
    getProductById,
    updateProductStock,
    updateProductSold,
    updateProductStockAfterOrder,
    getTotalProducts,
    getProductImagesByProductId,
    getProductBackGroundImageByProductId,
    deleteCartItemsByProductId,
    deleteDiscountsByProductId,
    deleteOrderItemsByProductId,
    deleteOrdersWithoutItems,
};
