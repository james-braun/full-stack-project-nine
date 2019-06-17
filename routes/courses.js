'use strict'

const express = require('express');
var Course = require('../models').Course;
var User = require('../models').User;

// Construct a router instance.
const router = express.Router();
const { check, validationResult } = require('express-validator/check');
const authenticateUser = require('./authenticateUser');

router.get('/courses', (req, res) => {
    var coursesArray = [];
    Course.findAll().then(async (courses) => {
        for (var i = 0; i < courses.length; i += 1) {
            coursesArray.push({ course: courses[i], owner: await User.findAll({ where: { id: courses[i].userId } }) } );
        };

        for (var i = 0; i < coursesArray.length; i += 1) {
            coursesArray[i].owner[0].password = null;
        }
        res.json(coursesArray);
    });
});

router.get('/courses/:id', (req, res) => {
    Course.findByPk(req.params.id).then((course) => {
        if (course) {
            User.findByPk(course.userId).then((user) => {
                if (user) {
                    res.json({ course, user }).end();
                } else {
                    res.status(500).json({ message: "Server Error" });
                }
            });
        } else {
            res.status(500).json({ message: "Server Error" });
        }
    });
});

router.post('/courses', authenticateUser, [
    check('title')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for "title"'),
    check('description')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for "description"'),
    check('userId')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for "userId"'),
], (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);

        return res.status(400).json({ errors: errorMessages });
    }
    Course.findAll({ where: { title: req.body.title } }).then((course) => {
        if (course.length > 0) {
            return res.status(400).json({ errors: "Course already exists." });
        } else {
            //course = req.body;
        }
        Course.create(req.body).then(course => {
            res.status(201).redirect(`/api/courses/${course.dataValues.id}`);
        });
        
    });
});

router.put('/courses/:id', authenticateUser, [
    check('title')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for "title"'),
    check('description')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for "description"'),
], (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);

        return res.status(400).json({ errors: errorMessages });
        }
        Course.findByPk(req.params.id).then((course) => {
            if (course) {
                course.update(req.body);
                res.status(204).end();
            }
        });
});

router.delete('/courses/:id', authenticateUser, (req, res) => {

    Course.findByPk(req.params.id).then(course => {
        if (course) {
            course.destroy();
            res.status(204).end();
        } else {
            res.status(500).end();
        }
    });
});

module.exports = router;