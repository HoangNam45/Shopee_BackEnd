// const sql = require('mssql/msnodesqlv8');
// const config = {
//     // server: '21AK22-COM\\DAYLASQL',
//     server: 'DESKTOP-TMPNLFQ\\NAM',
//     database: 'Shopee',
//     driver: 'msnodesqlv8',
//     options: {
//         trustedConnection: true,
//     },
// };
// const poolPromise = new sql.ConnectionPool(config)
//     .connect()
//     .then((pool) => {
//         console.log('Connected to SQL Server');
//         return pool;
//     })
//     .catch((err) => {
//         console.error('Database Connection Failed!', err);
//         process.exit(1);
//     });
// module.exports = {
//     sql,
//     poolPromise,
// };

const sql = require('mssql'); // Đây là mssql, không cần cài thêm gì nếu bạn đã cài mssql trong dự án
const config = {
    server: 'db', // 'db' là tên dịch vụ SQL Server trong docker-compose
    database: 'Shopee', // Tên database bạn đã tạo trong container
    user: 'sa', // Tên người dùng (sa là tài khoản admin của SQL Server)
    password: 'YourStrongP@ssword123', // Mật khẩu đã được thiết lập trong docker-compose
    port: 1433, // Cổng kết nối (SQL Server mặc định là 1433)
    options: {
        encrypt: true, // Mã hóa kết nối
        trustServerCertificate: true, // Chấp nhận chứng chỉ tự ký (nếu cần)
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
