'use strict';

// load modules.
const express = require('express');
const { check, validationResult } = require('express-validator/check');
const User = require('../models').User;
const bcryptjs = require('bcryptjs');
const authenticateUser = require('./authenticateUser');

// Construct a router instance.
const router = express.Router();

// returns an authenticated user.
router.get('/users', authenticateUser, (req, res) => {
    const user = req.currentUser;
    res.json({
        user: [
            {
                id: user.dataValues.id,
                firstName: user.dataValues.firstName,
                lastName: user.dataValues.lastName,
                email: user.dataValues.emailAddress
            }
        ]
    });
});

// creates a user account.
router.post('/users', [

    // check for validation errors.
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

    // get errors.
    const errors = validationResult(req);

    // if there are errors return them.
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);

        return res.status(400).json({ errors: errorMessages });
    }

    // if the email is a valid email then create user account.
    var regExpression = /^[^@]+@[^@.]+\.[a-z]+$/i;
    if (regExpression.test(req.body.emailAddress)) {

        // if the email already exists in the system return error.
        User.findAll({ where: { emailAddress: req.body.emailAddress } }).then((user) => {
            if (user.length > 0) {
                return res.status(400).json({ errors: "User already exists." });
            } else {
                user = req.body;
            }

            // encrypt password and create user.
            user.password = bcryptjs.hashSync(user.password);
            User.create(user);
            res.status(201).location('/').end();
        });

    // if the email is not a valid email return error.
    } else {
        return res.status(400).json({ errors: "Not a valid email address." });
    }
   
});

module.exports = router;