const { createUser, getUserByAccount } = require('../../services/userService');
const { createToken, validatePassword } = require('../../services/authService');
const { createSeller, getSellerByUserId } = require('../../services/sellerService');
const { poolPromise } = require('../../config/db/index');

class AuthController {
    // [POST] /auth/register
    async register(req, res) {
        let transaction;
        try {
            const { account, password } = req.body;
            const pool = await poolPromise;
            transaction = pool.transaction();
            await transaction.begin();

            const userId = await createUser({ account, password, transaction });
            await createSeller({ name: account, userId, transaction });
            await transaction.commit();
            res.status(201).send('User created');
        } catch (error) {
            await transaction.rollback();
            console.error('Error registering user', error);
            res.status(500).send('Error registering user');
        }
    }

    // [POST] /auth/login
    async login(req, res) {
        const { account, password } = req.body;

        try {
            const user = await getUserByAccount(account);
            const seller = await getSellerByUserId({ userId: user.Id });
            const isPasswordValid = await validatePassword(password, user.Password);

            if (!isPasswordValid) {
                return res.status(400).send('Invalid password');
            }

            const token = createToken(user, seller);
            res.send({ token });
        } catch (error) {
            console.error('Error logging in', error);
            res.status(500).send('Error logging in');
        }
    }
}

module.exports = new AuthController();
