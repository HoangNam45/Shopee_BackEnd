const { decodeToken } = require('../../services/authService');
const { match } = require('path-to-regexp');

const checkUserToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    const nonSecurePaths = [
        '/auth/login',
        '/auth/register',
        '/products',
        '/products/search/:slug',
        '/products/detail/:slug',
        '/uploads/images/productBackGroundImage/:slug',
        '/uploads/images/productImages/:slug',
        '/uploads/images/sellerAvatar/:slug',
        '/uploads/images/userAvatar/:slug',
    ];

    const isNonSecurePath = nonSecurePaths.some((path) => match(path)(req.path));

    if (isNonSecurePath) {
        return next();
    }

    if (!authHeader || !authHeader.startsWith('Bearer')) {
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
