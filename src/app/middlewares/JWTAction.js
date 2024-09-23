const { decodeToken } = require('../../services/authService');
const { match } = require('path-to-regexp');

const checkUserToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Sử dụng regex để khớp đường dẫn động
    const nonSecurePaths = [
        '/auth/login',
        '/auth/register',
        '/products',
        '/products/:slug',
        '/uploads/images/productBackGroundImage/:slug',
        '/uploads/images/productImages/:slug',
        '/uploads/images/sellerAvatar/:slug',
    ];

    const isNonSecurePath = nonSecurePaths.some((path) => match(path)(req.originalUrl));

    if (isNonSecurePath) {
        return next();
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token not found' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = decodeToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = { checkUserToken };
