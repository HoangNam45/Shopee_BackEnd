const authRouter = require('./auth');
const sellerRouter = require('./seller');
const productRouter = require('./product');
const { checkUserToken } = require('../app/middlewares/JWTAction');

function route(app) {
    app.use(checkUserToken);
    app.use('/products', productRouter);
    app.use('/seller', sellerRouter);
    app.use('/auth', authRouter);
}
module.exports = route;
