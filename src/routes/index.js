const siteRouter = require('./site');
const sellerRouter = require('./seller');
const productRouter = require('./product');

function route(app) {
    app.use('/products', productRouter);
    app.use('/seller', sellerRouter);
    app.use('/', siteRouter);
}
module.exports = route;
