const auth = require('basic-auth');
var User = require('../models').User;
const bcryptjs = require('bcryptjs');

// note: this function was taken and modified from the teachers notes
// on team treehouse at: https://teamtreehouse.com/library/rest-api-authentication-with-express
const authenticateUser = (req, res, next) => {
    let message = null;

    // get the authorization credentials.
    const credentials = auth(req);

    // if the credentials aren't null then...
    if (credentials.name !== '' && credentials.pass !== '' && credentials) {

        // find the user that matches the email in credentails.
        User.findAll({ where: { emailAddress: credentials.name } }).then(function (user) {

            // if the user exists...
            if (user.length > 0) {

                // compare the passwords.
                const authenticated = bcryptjs
                    .compareSync(credentials.pass, user[0].dataValues.password);

                // if the passwords match display success and store the results in the req object.
                if (authenticated) {
                    console.log(`Authentication successful for user: ${user[0].dataValues.firstName} ${user[0].dataValues.lastName}`);
                    req.currentUser = user[0];

                // else prepare error message.
                } else {
                    message = `Authentication failure for user: ${user[0].dataValues.firstName} ${user[0].dataValues.lastName}`;
                }
            // if user does not exist prepare message.
            } else {
                message = `User not found for email: ${credentials.name}`;
            }

            // if there is an error log the error and send message. else got to next function.
            if (message) {
                console.warn(message);
                res.status(401).json({ message: 'Access Denied' });
            } else {
                next();
            }
        });

    // if cedentials are null then log the error and send the error.
    } else {
        console.warn('Auth header not found');
        res.status(401).json({ message: 'Access Denied' });
    }
};

module.exports = authenticateUser;