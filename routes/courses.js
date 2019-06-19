'use strict'

// load modules.
const express = require('express');
const Course = require('../models').Course;
const User = require('../models').User;
const router = express.Router();
const { check, validationResult } = require('express-validator/check');
const authenticateUser = require('./authenticateUser');
const auth = require('basic-auth');

// display the list of courses and their associated users.
router.get('/courses', (req, res) => {

    // holds lists of courses and users.
    var coursesArray = [];

    // gets list of courses.
    Course.findAll({ attributes: { exclude: ['createdAt', 'updatedAt'] } }).then(async (courses) => {

        // creates an array of courses and associated users.
        for (var i = 0; i < courses.length; i += 1) {
            coursesArray.push({ course: courses[i], user: await User.findAll({attributes: { exclude: ['createdAt', 'updatedAt', 'password'] }, where: { id: courses[i].userId } }) } );
        };

        // returns the array.
        res.json(coursesArray);
    });
});

// returns a course and an associated user.
router.get('/courses/:id', (req, res) => {

    // find course.
    Course.findOne({ where: { id: req.params.id }, attributes: { exclude: ['createdAt', 'updatedAt'] } }).then((course) => {

        // if course exists find user and send results.
        if (course) {
            User.findOne({ where: { id: course.userId }, attributes: { exclude: ['createdAt', 'updatedAt', 'password'] } }).then((user) => {

                // if user exists send results. otherwise send error.
                if (user) {
                    res.json({ course, user }).end();
                } else {
                    res.status(500).json({ message: "Server Error" });
                }
            });

        // if course does not exist send error.
        } else {
            res.status(500).json({ message: "Server Error" });
        }
    });
});

// creates a new course.
router.post('/courses', authenticateUser, [

    // checks for errors.
    check('title')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for "title"'),
    check('description')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for "description"'),
], (req, res) => {

    // get errors if any.
    const errors = validationResult(req);

    // get authorization credentials.
    const credentials = auth(req);

    // if there are errors send them.
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);

        return res.status(400).json({ errors: errorMessages });
    }

    // find out if course already exists.
    Course.findAll({ where: { title: req.body.title } }).then((course) => {

        // if course exists send error.
        if (course.length > 0) {
            return res.status(400).json({ errors: "Course already exists." });
        } 

        // find user id to match with the course. then create course and set location to
        // course id.
        User.findAll({ where: { emailAddress: credentials.name } }).then((user) => {
            req.body.userId = user[0].dataValues.id;
        }).then(() => {
            Course.create(req.body).then(course => {
                res.status(201).location(`/api/courses/${course.dataValues.id}`);
            });
        });
    });
});

// updates a course.
router.put('/courses/:id', authenticateUser, [

    // checks for errors.
    check('title')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for "title"'),
    check('description')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for "description"'),
], (req, res) => {

    // get errors if any.
    const errors = validationResult(req);

    // get authorization credentials.
    const credentials = auth(req);

    // if there are errors send them.
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);

        return res.status(400).json({ errors: errorMessages });
    }

    // find the course to update.
    Course.findByPk(req.params.id).then(async (course) => {

        // if course exists then...
        if (course) {

            // find the id of the user who is authenticated and ...
            await User.findAll({ where: { emailAddress: credentials.name } }).then((user) => {

                // if authenticated user matches course user id then update course. else send error.
                if (user[0].dataValues.id === course.dataValues.userId) {
                    course.update(req.body);
                    res.status(204).end();
                } else {
                    res.status(403).end();
                }
            });

        // if course does not exist send error.
        } else {
            res.status(400).end();
        }
    });
});


// deletes a course.
router.delete('/courses/:id', authenticateUser, (req, res) => {

    // get authorization credentials.
    const credentials = auth(req);

    // find course.
    Course.findByPk(req.params.id).then(async course => {

        // if course exists...
        if (course) {

            // find user id of the person authenticated and ...
            await User.findAll({ where: { emailAddress: credentials.name } }).then((user) => {

                // if authenticated user matches course user id then delete course. else send error.
                if (user[0].dataValues.id === course.dataValues.userId) {
                    course.destroy();
                    res.status(204).end();
                } else {
                    res.status(403).end();
                }
            });

        // if course doesn't exist then send error.
        } else {
            res.status(500).end();
        }
    });
});

module.exports = router;