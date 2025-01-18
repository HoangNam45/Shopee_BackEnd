const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const SECRET_KEY = process.env.JWT_SECRET_KEY;

const createToken = (user, seller) => {
    try {
        const payload = { id: user.Id, seller_id: seller.Id };
        return jwt.sign(payload, SECRET_KEY, { expiresIn: '1d' });
    } catch (error) {
        console.error('Error creating token', error);
        throw new Error('Token creation failed');
    }
};

const validatePassword = async (inputPassword, password) => {
    try {
        return await bcrypt.compare(inputPassword, password);
    } catch (error) {
        console.error('Error validating password', error);
        throw new Error('Password validation failed');
    }
};

const decodeToken = (token) => {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (error) {
        console.error('Error decoding token', error);
        throw new Error('Token decoding failed');
    }
};
module.exports = { createToken, validatePassword, decodeToken };
