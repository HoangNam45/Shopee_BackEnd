const sql = require('mssql/msnodesqlv8');
const config = {
    // server: '21AK22-COM\\DAYLASQL',
    server: 'DESKTOP-TMPNLFQ\\NAM',
    database: 'ShopeeClone',
    driver: 'msnodesqlv8',
    options: {
        trustedConnection: true,
    },
};
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then((pool) => {
        console.log('Connected to SQL Server');
        return pool;
    })
    .catch((err) => {
        console.error('Database Connection Failed!', err);
        process.exit(1);
    });
module.exports = {
    sql,
    poolPromise,
};
