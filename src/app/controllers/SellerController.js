const { sql, poolPromise } = require('../../config/db/index');
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET_KEY;
class SellerController {
    // [GET] /seller/information
    async getSellerInfo(req, res) {
        try {
            // Lấy token từ header của yêu cầu
            const token = req.headers.authorization.split(' ')[1]; // 'Bearer <token>'
            // Giải mã token để lấy userId
            const decoded = jwt.verify(token, SECRET_KEY);
            const userId = decoded.id;
            const pool = await poolPromise;
            const result = await pool
                .request()
                .input('UserId', sql.Int, userId)
                .query('SELECT * FROM Sellers Where UserId = @UserId');

            const sellerData = {
                name: result.recordset[0].Name,
                avatar: result.recordset[0].Avatar,
            };
            res.status(200).json(sellerData);
        } catch (error) {
            console.error('Error fetching products', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // [PUT] /seller/updateInformation
    async updateSellerInfo(req, res) {
        try {
            // Lấy token từ header của yêu cầu
            const token = req.headers.authorization.split(' ')[1]; // 'Bearer
            const decoded = jwt.verify(token, SECRET_KEY);
            const userId = decoded.id;

            const { shopName } = req.body;

            let avatar = '';
            if (req.file) {
                avatar = req.file.filename;
            } else {
                avatar = req.body.shopAvt;
            }

            const pool = await poolPromise;
            const request = pool.request();
            request.input('UserId', sql.Int, userId);
            request.input('Name', sql.NVarChar, shopName);
            request.input('Avatar', sql.NVarChar, avatar);

            const result = await request.query(`
                UPDATE Sellers
                SET 
                    Name = COALESCE(@Name, Name), 
                    Avatar = COALESCE(@Avatar, Avatar)
                OUTPUT inserted.Name, inserted.Avatar
                WHERE UserId = @UserId
            `);

            const sellerNewInfo = result.recordset[0];
            console.log(sellerNewInfo);
            res.status(200).json(sellerNewInfo);
        } catch (error) {
            console.error('Error updating seller information', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
}

module.exports = new SellerController();
