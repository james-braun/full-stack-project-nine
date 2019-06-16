'use strict';

const express = require('express');
const { check, validationResult } = require('express-validator/check');
var User = require('../models').User;
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');

// Construct a router instance.
const router = express.Router();

const authenticateUser = (req, res, next) => {
    let message = null;

    // Parse the user's credentials from the Authorization header.
    const credentials = auth(req);

    // If the user's credentials are available...
    if (credentials.name !== '' && credentials.pass !== '') {
        // Attempt to retrieve the user from the data store
        // by their email address (i.e. the user's "key"
        // from the Authorization header).
        User.findAll({ where: { emailAddress: credentials.name } }).then(function (user) {
            // If a user was successfully retrieved from the data store...
            if (user.length > 0) {
                // Use the bcryptjs npm package to compare the user's password
                // (from the Authorization header) to the user's password
                // that was retrieved from the data store.
                const authenticated = bcryptjs
                    .compareSync(credentials.pass, user[0].dataValues.password);

                // If the passwords match...
                if (authenticated) {
                    console.log(`Authentication successful for user: ${user[0].dataValues.firstName} ${user[0].dataValues.lastName}`);

                    // Then store the retrieved user object on the request object
                    // so any middleware functions that follow this middleware function
                    // will have access to the user's information.
                    req.currentUser = user[0];
                } else {
                    message = `Authentication failure for user: ${user[0].dataValues.firstName} ${user[0].dataValues.lastName}`;
                }
            } else {
                message = `User not found for email: ${credentials.name}`;
            }

            // If user authentication failed...
            if (message) {
                console.warn(message);

                // Return a response with a 401 Unauthorized HTTP status code.
                res.status(401).json({ message: 'Access Denied' });
            } else {
                // Or if user authentication succeeded...
                // Call the next() method.
                next();

            }
        });
    } else {
        console.warn('Auth header not found');

        // Return a response with a 401 Unauthorized HTTP status code.
        res.status(401).json({ message: 'Access Denied' });
    }
};

// Route that returns an authenticated user.
router.get('/users', authenticateUser, (req, res) => {
    const user = req.currentUser;
    res.json({
        firstName: user.dataValues.firstName,
        lastName: user.dataValues.lastName,
        email: user.dataValues.emailAddress
    });
});

// Route that creates a new user.
router.post('/users', [
    check('firstName')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for "firstName"'),
    check('lastName')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for "lastName"'),
    check('emailAddress')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for "emailAddress"'),
    check('password')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for "password"'),
], (req, res) => {

    // Attempt to get the validation result from the Request object.
    const errors = validationResult(req);

    // If there are validation errors...
    if (!errors.isEmpty()) {
        // Use the Array `map()` method to get a list of error messages.
        const errorMessages = errors.array().map(error => error.msg);

        // Return the validation errors to the client.
        return res.status(400).json({ errors: errorMessages });
    }

    // Get the user from the request body.
    const user = req.body;
        console.log(user);
    user.password = bcryptjs.hashSync(user.password);
    // Add the user to the `users` array.
    User.create(user);

    // Set the status to 201 Created and end the response.
    res.status(201).end();
});

module.exports = router;