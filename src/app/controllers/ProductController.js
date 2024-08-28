const { sql, poolPromise } = require('../../config/db/index');
const jwt = require('jsonwebtoken');
const slugify = require('slugify');
const { v4: uuidv4 } = require('uuid');
const SECRET_KEY = process.env.JWT_SECRET_KEY;
class ProductController {
    //[Post] /products/add_product
    async addProduct(req, res) {
        async function generateUniqueSlug(baseSlug) {
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
        }
        try {
            // Lấy token từ header của yêu cầu
            const token = req.headers.authorization.split(' ')[1]; // 'Bearer <token>'
            // console.log(token);
            // Giải mã token để lấy userId
            const decoded = jwt.verify(token, SECRET_KEY);
            const userId = decoded.id;

            const productImages = req.files['productImages'] || [];
            const productBackGroundImage = req.files['productBackGroundImage'] || [];
            const { productName, productDescription, productPrice, productStock, productPriceRange, productSKU } =
                req.body;

            // Tạo slug từ tên sản phẩm
            const baseSlug = slugify(productName, { strict: true });
            const slug = await generateUniqueSlug(baseSlug);

            const pool = await poolPromise;
            const transaction = pool.transaction();

            await transaction.begin();

            const sellerResult = await transaction
                .request()
                .input('UserId', sql.Int, userId)
                .query('SELECT Id FROM Sellers WHERE UserId = @UserId');
            const sellerId = sellerResult.recordset[0].Id;

            // Lưu sản phẩm vào bảng Products
            const productResult = await transaction
                .request()
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

            const productId = productResult.recordset[0].Id;

            // Lưu từng hình ảnh vào bảng ProductImages
            for (const image of productImages) {
                await transaction
                    .request()
                    .input('ProductId', sql.Int, productId)
                    .input('ImageUrl', sql.NVarChar, image.filename)
                    .query('INSERT INTO ProductImages (ProductId, ImageUrl) VALUES (@ProductId, @ImageUrl)');
            }
            // Lưu từng mức giá vào bảng ProductPriceRanges
            const priceRanges = JSON.parse(productPriceRange);
            // console.log(priceRanges);
            for (const priceRange of priceRanges) {
                await transaction
                    .request()
                    .input('ProductId', sql.Int, productId)
                    .input('StartRange', sql.Int, priceRange.from)
                    .input('EndRange', sql.Int, priceRange.to)
                    .input('SpecificPrice', sql.Float, priceRange.price)
                    .query(
                        'INSERT INTO ProductPriceRanges (ProductId, StartRange, EndRange, SpecificPrice) VALUES (@ProductId, @StartRange, @EndRange, @SpecificPrice)',
                    );
            }

            await transaction.commit();

            res.status(200).json({ message: 'Product added successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // [GET] /products
    async getProducts(req, res) {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query('SELECT * FROM Products ORDER BY CreatedAt DESC'); // Sắp xếp sản phẩm theo CreatedAt từ mới đến cũ

            res.status(200).json(result.recordset);
        } catch (error) {
            console.error('Error fetching products', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // [GET] /products/:slug
    async getProductDetail(req, res) {
        const { slug } = req.params;
        try {
            const pool = await poolPromise;
            const result = await pool.request().input('Slug', sql.NVarChar, slug).query(`SELECT 
            Products.Name, 
            Products.Description, 
            Products.Price, 
            Products.Stock, 
            ProductImages.ImageUrl
        FROM 
            Products
        INNER JOIN 
            dbo.ProductImages ON Products.Id = ProductImages.ProductId
        WHERE 
            Products.Slug = @Slug`);
            const product = {
                Name: result.recordset[0].Name,
                Description: result.recordset[0].Description,
                Price: result.recordset[0].Price,
                Stock: result.recordset[0].Stock,
                Images: result.recordset.map((record) => record.ImageUrl),
            };
            res.status(200).json(product);
        } catch (error) {
            console.error('Error fetching products', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
}

module.exports = new ProductController();
