const { poolPromise } = require('../config/db');

const getRequest = async (transaction) => {
    if (transaction) {
        return transaction.request();
    } else {
        const pool = await poolPromise;
        return pool.request();
    }
};

module.exports = { getRequest };
