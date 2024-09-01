const { createUser, getUserByAccount } = require('../../services/userService');
const { createToken, validatePassword } = require('../../services/authService');

class AuthController {
    // [POST] /auth/register
    async register(req, res) {
        try {
            const { account, password } = req.body;

            await createUser(account, password);
            res.status(201).send('User created');
        } catch (error) {
            console.error('Error registering user', error);
            res.status(500).send('Error registering user');
        }
    }

    // [POST] /auth/login
    async login(req, res) {
        const { account, password } = req.body;

        try {
            const user = await getUserByAccount(account);
            console.log('user', user);

            const isPasswordValid = await validatePassword(password, user.Password);

            if (!isPasswordValid) {
                return res.status(400).send('Invalid password');
            }

            const token = createToken(user);
            res.send({ token });
        } catch (error) {
            console.error('Error logging in', error);
            res.status(500).send('Error logging in');
        }
    }
}

module.exports = new AuthController();
