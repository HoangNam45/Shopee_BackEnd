const { sql, poolPromise } = require('../../config/db/index');
const { decodeToken } = require('../../services/authService');
const {
    createProductUniqueSlug,
    createNewProduct,
    insertProductImages,
    insertProductPriceRanges,
    getLatestProducts,
    getProductDetail,
} = require('../../services/productService');
const { getSellerByUserId, getSellerById } = require('../../services/sellerService');

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
                insertProductImages({ productId, image, transaction });
            }

            // Lưu từng mức giá vào bảng ProductPriceRanges
            const priceRanges = JSON.parse(productPriceRange);
            for (const priceRange of priceRanges) {
                insertProductPriceRanges({ productId, priceRange, transaction });
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
            const productData = await getLatestProducts();
            res.status(200).json(productData);
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

            const product = await getProductDetail({ slug, transaction });

            const productData = {
                Name: product[0].Name,
                Description: product[0].Description,
                Price: product[0].Price,
                Stock: product[0].Stock,
                Images: product.map((record) => record.ImageUrl),
                SellerId: product[0].SellerId,
            };

            const seller = await getSellerById(productData.SellerId, transaction);

            const sellerData = {
                SellerName: seller.Name,
                SellerAvatar: seller.Avatar,
            };

            await transaction.commit();
            const data = {
                ...productData,
                ...sellerData,
            };

            res.status(200).json(data);
        } catch (error) {
            console.error('Error fetching products', error);

            res.status(500).json({ message: 'Server error' });
        }
    }
}

module.exports = new ProductController();
