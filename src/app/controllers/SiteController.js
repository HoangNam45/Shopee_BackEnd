const { sql, poolPromise } = require('../../config/db/index');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET_KEY;

class SiteController {
    // [POST] /register
    async register(req, res) {
        const { account, password } = req.body;

        try {
            const pool = await poolPromise;
            const transaction = pool.transaction();
            await transaction.begin();

            const hashedPassword = await bcrypt.hash(password, 10);
            // Insert into Users table
            const userResult = await transaction
                .request()
                .input('account', sql.VarChar, account)
                .input('password', sql.VarChar, hashedPassword)
                .query('INSERT INTO Users (Account, Password) OUTPUT INSERTED.Id VALUES (@account, @password)');
            const userId = userResult.recordset[0].Id;
            // Insert into Sellers table
            await transaction
                .request()
                .input('Name', sql.VarChar, account)
                .input('UserId', sql.Int, userId)
                .query('INSERT INTO Sellers (Name, UserId) VALUES (@Name, @UserId)');

            await transaction.commit();
            res.status(201).send('User registered successfully');
        } catch (err) {
            console.error('Error registering user', err);
            res.status(500).send('Error registering user');
        }
    }

    // [POST] /login
    async login(req, res) {
        const { account, password } = req.body;

        try {
            const pool = await poolPromise;

            const request = pool.request();
            request.input('account', sql.VarChar, account);

            const result = await request.query('SELECT * FROM Users WHERE Account = @account');

            if (result.recordset.length === 0) {
                return res.status(400).send('User not found');
            }

            const user = result.recordset[0];
            const isPasswordValid = await bcrypt.compare(password, user.Password);

            if (!isPasswordValid) {
                return res.status(400).send('Invalid password');
            }

            const token = jwt.sign({ id: user.Id }, SECRET_KEY, { expiresIn: '5h' });
            res.send({ token });
        } catch (error) {
            console.error('Error logging in', error);
            res.status(500).send('Error logging in');
        }
    }
}

module.exports = new SiteController();
