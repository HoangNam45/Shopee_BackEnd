const { sql, poolPromise } = require('../../config/db/index');

class ProductController {
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
