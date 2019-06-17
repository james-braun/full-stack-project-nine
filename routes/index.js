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

router.get('/users', authenticateUser, (req, res) => {
    const user = req.currentUser;
    res.json({
        id: user.dataValues.id,
        firstName: user.dataValues.firstName,
        lastName: user.dataValues.lastName,
        email: user.dataValues.emailAddress
    });
});

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

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);

        return res.status(400).json({ errors: errorMessages });
    }
        User.findAll({ where: { emailAddress: req.body.emailAddress } }).then((user) => {
            if (user) {
                return res.status(400).json({ errors: "User already exists." });
            } else {
                user = req.body;
            }
            user.password = bcryptjs.hashSync(user.password);
            User.create(user);
            res.status(201).redirect('/');
        });
});

module.exports = router;