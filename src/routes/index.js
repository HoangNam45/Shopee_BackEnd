const authRouter = require('./auth');
const sellerRouter = require('./seller');
const productRouter = require('./product');

function route(app) {
    app.use('/products', productRouter);
    app.use('/seller', sellerRouter);
    app.use('/auth', authRouter);
}
module.exports = route;
