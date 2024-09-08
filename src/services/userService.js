const { sql, poolPromise } = require('../config/db/index');
const bcrypt = require('bcrypt');

const createUser = async ({ account, password, transaction = null }) => {
    const request = transaction ? transaction.request() : (await poolPromise).request();

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const userResult = await request
            .input('account', sql.VarChar, account)
            .input('password', sql.VarChar, hashedPassword)
            .query('INSERT INTO Users (Account, Password) OUTPUT INSERTED.Id VALUES (@account, @password)');
        const userId = userResult.recordset[0].Id;
        // Insert into Sellers table

        return userId;
    } catch (err) {
        console.error('Error registering user', err);

        throw err;
    }
};

const getUserByAccount = async (account) => {
    try {
        const pool = await poolPromise;
        const request = pool.request();
        request.input('account', sql.VarChar, account);
        const result = await request.query('SELECT * FROM Users WHERE Account = @account');
        return result.recordset[0];
    } catch (err) {
        console.error('Error getting user by account', err);
        throw err;
    }
};

module.exports = { createUser, getUserByAccount };
