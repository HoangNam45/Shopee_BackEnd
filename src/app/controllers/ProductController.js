const { sql, poolPromise } = require('../../config/db/index');
const { decodeToken } = require('../../services/authService');
const { createProductUniqueSlug, createNewProduct } = require('../../services/productService');
const { getSellerByUserId } = require('../../services/sellerService');

const slugify = require('slugify');

class ProductController {
    //[Post] /products/add_product
    async addProduct(req, res) {
        try {
            // Lấy token từ header của yêu cầu
            const token = req.headers.authorization.split(' ')[1]; // 'Bearer <token>'
            const decoded = decodeToken(token);
            const userId = decoded.id;

            const productImages = req.files['productImages'] || [];
            const productBackGroundImage = req.files['productBackGroundImage'] || [];
            const { productName, productDescription, productPrice, productStock, productPriceRange, productSKU } =
                req.body;

            // Tạo slug từ tên sản phẩm
            const baseSlug = slugify(productName, { strict: true });
            const slug = await createProductUniqueSlug(baseSlug);

            const pool = await poolPromise;
            const transaction = pool.transaction();
            await transaction.begin();

            const sellerData = await getSellerByUserId(userId, transaction);
            const sellerId = sellerData.Id;

            // Lưu sản phẩm vào bảng Products
            const productData = await createNewProduct({
                sellerId,
                slug,
                productName,
                productDescription,
                productPrice,
                productStock,
                productPriceRange,
                productSKU,
                productBackGroundImage,
            });

            const productId = productData.Id;

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
            const transaction = pool.transaction();

            await transaction.begin();

            const productInfo = await transaction.request().input('Slug', sql.NVarChar, slug).query(`SELECT 
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
            const product = {
                Name: productInfo.recordset[0].Name,
                Description: productInfo.recordset[0].Description,
                Price: productInfo.recordset[0].Price,
                Stock: productInfo.recordset[0].Stock,
                Images: productInfo.recordset.map((record) => record.ImageUrl),
                SellerId: productInfo.recordset[0].SellerId,
            };
            const sellerInfo = await transaction
                .request()
                .input('SellerId', sql.Int, product.SellerId)
                .query('SELECT Name, Avatar FROM Sellers WHERE Id = @SellerId');
            const seller = {
                SellerName: sellerInfo.recordset[0].Name,
                SellerAvatar: sellerInfo.recordset[0].Avatar,
            };

            await transaction.commit();
            const data = {
                ...product,
                ...seller,
            };
            console.log(data);
            res.status(200).json(data);
        } catch (error) {
            console.error('Error fetching products', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
}

module.exports = new ProductController();
