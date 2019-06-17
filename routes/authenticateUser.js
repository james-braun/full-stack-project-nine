const auth = require('basic-auth');
var User = require('../models').User;
const bcryptjs = require('bcryptjs');

const authenticateUser = (req, res, next) => {
    let message = null;
    const credentials = auth(req);
    if (credentials.name !== '' && credentials.pass !== '') {
        User.findAll({ where: { emailAddress: credentials.name } }).then(function (user) {
            if (user.length > 0) {
                const authenticated = bcryptjs
                    .compareSync(credentials.pass, user[0].dataValues.password);
                if (authenticated) {
                    console.log(`Authentication successful for user: ${user[0].dataValues.firstName} ${user[0].dataValues.lastName}`);
                    req.currentUser = user[0];
                } else {
                    message = `Authentication failure for user: ${user[0].dataValues.firstName} ${user[0].dataValues.lastName}`;
                }
            } else {
                message = `User not found for email: ${credentials.name}`;
            }
            if (message) {
                console.warn(message);
                res.status(401).json({ message: 'Access Denied' });
            } else {
                next();
            }
        });
    } else {
        console.warn('Auth header not found');
        res.status(401).json({ message: 'Access Denied' });
    }
};

module.exports = authenticateUser;