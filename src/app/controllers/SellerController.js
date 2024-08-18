const { sql, poolPromise } = require('../../config/db/index');

const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET_KEY;
class SellerController {
    // [POST] /seller/add_product
    async add_product(req, res) {
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

            const pool = await poolPromise;
            const transaction = pool.transaction();

            await transaction.begin();

            // Lưu sản phẩm vào bảng Products
            const productResult = await transaction
                .request()
                .input('UserId', sql.Int, userId)
                .input('BackGround', sql.NVarChar, productBackGroundImage[0]?.filename || null)
                .input('Name', sql.NVarChar, productName)
                .input('Description', sql.NVarChar, productDescription)
                .input('Price', sql.Float, productPrice)
                .input('Stock', sql.Int, productStock)
                .input('SKU', sql.NVarChar, productSKU)
                .query(
                    'INSERT INTO Products (UserId,BackGround, Name, Description, Price, Stock, SKU) OUTPUT INSERTED.Id VALUES (@UserId, @BackGround, @Name, @Description, @Price, @Stock, @SKU)',
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
}

module.exports = new SellerController();
