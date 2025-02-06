const { poolPromise } = require('../../config/db/index');
const {
    createProductUniqueSlug,
    createNewProduct,
    updateProduct,
    insertProductImages,
    insertProductPriceRanges,
    getLatestProducts,
    getProductDetail,
    getSellerLatestProduct,
    getSellerActiveProduct,
    getSellerTotalProducts,
    getSellerTotalActiveProducts,
    getSellerTotalHiddenProducts,
    getSellerHiddenProduct,
    getSellerDetailProduct,
    deleteProductImagesById,
    updateProductStatus,
    deleteProductById,
    getProductsBySearch,
    addDiscount,
    addDiscountProduct,
} = require('../../services/productService');

const { getSellerByUserId, getSellerById } = require('../../services/sellerService');

const slugify = require('slugify');

class ProductController {
    //[Post] /products/add_product
    async addProduct(req, res) {
        let transaction;

        try {
            const user = req.user;
            const userId = user.id;

            const productImages = req.files['productImages'] || [];
            const productBackGroundImage = req.files['productBackGroundImage'] || [];

            console.log(productImages);

            const {
                productName,
                productDescription,
                productPrice,
                productStock,
                productPriceRange,
                productSKU,
                productStatus,
            } = req.body;
            // Tạo slug từ tên sản phẩm
            const baseSlug = await slugify(productName, { strict: true });

            const pool = await poolPromise;
            transaction = pool.transaction();
            await transaction.begin();

            const slug = await createProductUniqueSlug({ baseSlug, transaction });
            const sellerData = await getSellerByUserId({ userId, transaction });

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
                productStatus,
                transaction,
            });

            const productId = productData.Id;

            // Lưu từng hình ảnh vào bảng ProductImages
            const newProductImages = productImages.map((file) => file.filename);
            for (const image of newProductImages) {
                await insertProductImages(productId, image, transaction);
            }

            // Lưu từng mức giá vào bảng ProductPriceRanges
            const priceRanges = JSON.parse(productPriceRange);
            for (const priceRange of priceRanges) {
                await insertProductPriceRanges({ productId, priceRange, transaction });
            }

            await transaction.commit();

            res.status(200).json({ message: 'Product added successfully' });
        } catch (error) {
            transaction.rollback();
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    //[Put] /products/update_product/:productId
    async updateProduct(req, res) {
        let transaction;

        try {
            const user = req.user;
            const userId = user.id;

            const productId = req.params.productId;

            const productImages = req.files['productImages'] || [];
            const productBackGroundImage = req.files['productBackGroundImage'] || [];
            console.log(productImages);
            const {
                productName,
                productDescription,
                productPrice,
                productStock,
                productSKU,
                productExistingBackGroundImage,
                productExistingImages,
            } = req.body;
            const baseSlug = await slugify(productName, { strict: true });

            const pool = await poolPromise;
            transaction = pool.transaction();
            await transaction.begin();

            const slug = await createProductUniqueSlug({ baseSlug, transaction });
            const sellerData = await getSellerByUserId({ userId, transaction });

            const sellerId = sellerData.Id;

            // Update product
            let updatedProductBackGroundImage;
            if (productExistingBackGroundImage) {
                updatedProductBackGroundImage = productExistingBackGroundImage;
            } else {
                updatedProductBackGroundImage = productBackGroundImage[0].filename;
            }
            const updatedProductData = await updateProduct({
                sellerId,
                productId,
                slug,
                productName,
                productDescription,
                productPrice,
                productStock,
                productSKU,
                updatedProductBackGroundImage,
                transaction,
            });

            // To update product images table, delete all existing images and insert new images!!!!!!!
            let updatedProdudctImages;
            const existingImagesArray = Array.isArray(productExistingImages)
                ? productExistingImages
                : productExistingImages
                ? [productExistingImages]
                : [];
            if (productImages.length > 0) {
                const uploadedImageFilenames = productImages.map((file) => file.filename);
                updatedProdudctImages = [...existingImagesArray, ...uploadedImageFilenames];
            } else {
                updatedProdudctImages = existingImagesArray;
            }
            console.log(productExistingImages);
            console.log(updatedProdudctImages);
            await deleteProductImagesById({ productId, transaction });

            for (const image of updatedProdudctImages) {
                await insertProductImages(productId, image, transaction);
            }
            await transaction.commit();

            res.status(200).json({ message: 'Product added successfully' });
        } catch (error) {
            transaction.rollback();
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }
    //[PUT] /products/update_product_status/:productId
    async updateProductStatus(req, res) {
        try {
            const { productStatus } = req.body;
            const { productId } = req.params;
            await updateProductStatus({ productId, productStatus });
            res.status(200).json({ message: 'Product status updated successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }
    //[DELETE] /products/delete_product/:productId
    async deleteProduct(req, res) {
        try {
            const { productId } = req.params;
            await deleteProductById(productId);
            res.status(200).json({ message: 'Product deleted successfully' });
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
        let transaction;
        try {
            const pool = await poolPromise;
            transaction = pool.transaction();
            await transaction.begin();

            const product = await getProductDetail({ slug, transaction });

            const productData = {
                ProductId: product[0].Id,
                Name: product[0].Name,
                Description: product[0].Description,
                Price: product[0].Original_price,
                Stock: product[0].Stock,
                Images: product.map((record) => record.ImageUrl),
                SellerId: product[0].SellerId,
                Final_price: product[0].Final_price,
                Discount: product[0].Discount_percentage,
                BackGround: product[0].BackGround,
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
            await transaction.rollback();
            console.error('Error fetching products', error);

            res.status(500).json({ message: 'Server error' });
        }
    }

    //[GET] /products/seller/latest_products
    async getSellerLatestProduct(req, res) {
        let transaction;

        const { page, limit } = req.query;
        const offset = (page - 1) * limit;

        const user = req.user;
        // console.log(user);
        // const token = req.headers.authorization.split(' ')[1];
        // console.log(token);

        // const user = decodeToken(token);
        const userId = user.id;

        try {
            const pool = await poolPromise;
            transaction = pool.transaction();
            await transaction.begin();

            const sellerData = await getSellerByUserId({ userId, transaction });
            const sellerId = sellerData.Id;

            const product = await getSellerLatestProduct({ sellerId, offset, limit, transaction });

            await transaction.commit();

            res.status(200).json(product);
        } catch (error) {
            await transaction.rollback();
            console.error('Error fetching seller latest products', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    //[GET] /products/seller/active_products
    async getSellerActiveProduct(req, res) {
        let transaction;

        const { page, limit } = req.query;
        const offset = (page - 1) * limit;

        const user = req.user;
        const userId = user.id;

        try {
            const pool = await poolPromise;
            transaction = pool.transaction();
            await transaction.begin();

            const sellerData = await getSellerByUserId({ userId, transaction });
            const sellerId = sellerData.Id;

            const product = await getSellerActiveProduct({ sellerId, offset, limit, transaction });

            await transaction.commit();

            res.status(200).json(product);
        } catch (error) {
            await transaction.rollback();
            console.error('Error fetching seller active products', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    //[GET] /products/seller/hidden_products
    async getSellerHiddenProduct(req, res) {
        let transaction;

        const { page, limit } = req.query;
        const offset = (page - 1) * limit;

        const user = req.user;
        const userId = user.id;

        try {
            const pool = await poolPromise;
            transaction = pool.transaction();
            await transaction.begin();

            const sellerData = await getSellerByUserId({ userId, transaction });
            const sellerId = sellerData.Id;

            const product = await getSellerHiddenProduct({ sellerId, offset, limit, transaction });

            await transaction.commit();

            res.status(200).json(product);
        } catch (error) {
            await transaction.rollback();
            console.error('Error fetching seller hidden products', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    //[GET] /products/seller/total_products
    async getSellerTotalProduct(req, res) {
        let transaction;

        const user = req.user;
        const userId = user.id;

        try {
            const pool = await poolPromise;
            transaction = pool.transaction();
            await transaction.begin();

            const sellerData = await getSellerByUserId({ userId, transaction });
            const sellerId = sellerData.Id;
            const totalProducts = await getSellerTotalProducts({ sellerId, transaction });

            await transaction.commit();
            res.status(200).json({ totalProducts });
        } catch (error) {
            await transaction.rollback();
            console.error('Error fetching seller total products', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    //[GET] /products/seller/total_active_products
    async getSellerTotalActiveProduct(req, res) {
        let transaction;

        const user = req.user;
        const userId = user.id;

        try {
            const pool = await poolPromise;
            transaction = pool.transaction();
            await transaction.begin();

            const sellerData = await getSellerByUserId({ userId, transaction });
            const sellerId = sellerData.Id;
            const totalActiveProducts = await getSellerTotalActiveProducts({ sellerId, transaction });

            await transaction.commit();
            res.status(200).json({ totalActiveProducts });
        } catch (error) {
            await transaction.rollback();
            console.error('Error fetching seller total products', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
    //[GET] /products/seller/total_hidden_products
    async getSellerTotalHiddenProduct(req, res) {
        let transaction;

        const user = req.user;
        const userId = user.id;

        try {
            const pool = await poolPromise;
            transaction = pool.transaction();
            await transaction.begin();

            const sellerData = await getSellerByUserId({ userId, transaction });
            const sellerId = sellerData.Id;
            const totalHiddenProducts = await getSellerTotalHiddenProducts({ sellerId, transaction });

            await transaction.commit();
            res.status(200).json({ totalHiddenProducts });
        } catch (error) {
            await transaction.rollback();
            console.error('Error fetching seller total products', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    //[GET] /products/seller/detail/product
    async getSellerDetailProduct(req, res) {
        let transaction;

        const user = req.user;
        const userId = user.id;
        const { productId } = req.params;

        try {
            const pool = await poolPromise;
            transaction = pool.transaction();
            await transaction.begin();

            const sellerData = await getSellerByUserId({ userId, transaction });
            const sellerId = sellerData.Id;

            const product = await getSellerDetailProduct({ sellerId, productId, transaction });

            const productData = {
                ...product[0],
                ImageUrl: product.map((record) => record.ImageUrl),
            };

            console.log(productData);
            await transaction.commit();
            res.status(200).json(productData);
        } catch (error) {
            await transaction.rollback();
            console.error('Error fetching seller detail products', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    //[GET] /products/search
    async getProductsBySearch(req, res) {
        try {
            const { query } = req.query;
            console.log(query);
            const productData = await getProductsBySearch({ query });
            console.log(productData);
            res.status(200).json(productData);
        } catch (error) {
            console.error('Error fetching products', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
}

module.exports = new ProductController();
