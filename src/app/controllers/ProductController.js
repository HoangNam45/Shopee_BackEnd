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
}

module.exports = new ProductController();
