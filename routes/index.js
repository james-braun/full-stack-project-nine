'use strict';

const express = require('express');
const { check, validationResult } = require('express-validator/check');
var User = require('../models').User;

const authenticateUser = require('./authenticateUser');

// Construct a router instance.
const router = express.Router();


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
    var regExpression = /^[^@]+@[^@.]+\.[a-z]+$/i;
    if (regExpression.test(req.body.emailAddress)) {
        User.findAll({ where: { emailAddress: req.body.emailAddress } }).then((user) => {
            if (user.length > 0) {
                return res.status(400).json({ errors: "User already exists." });
            } else {
                user = req.body;
            }
            user.password = bcryptjs.hashSync(user.password);
            User.create(user);
            res.status(201).redirect('/');
        });
    } else {
        return res.status(400).json({ errors: "Not a valid email address." });
    }
   
});

module.exports = router;