'use strict'

const express = require('express');
var Course = require('../models').Course;
var User = require('../models').User;

// Construct a router instance.
const router = express.Router();
const { check, validationResult } = require('express-validator/check');
const authenticateUser = require('./authenticateUser');
const auth = require('basic-auth');

router.get('/courses', (req, res) => {
    var coursesArray = [];
    Course.findAll({ attributes: { exclude: ['createdAt', 'updatedAt'] } }).then(async (courses) => {
        for (var i = 0; i < courses.length; i += 1) {
            coursesArray.push({ course: courses[i], user: await User.findAll({attributes: { exclude: ['createdAt', 'updatedAt', 'password'] }, where: { id: courses[i].userId } }) } );
        };
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
], (req, res) => {
    const errors = validationResult(req);
    const credentials = auth(req);
    
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);

        return res.status(400).json({ errors: errorMessages });
    }
    Course.findAll({ where: { title: req.body.title } }).then((course) => {
        if (course.length > 0) {
            return res.status(400).json({ errors: "Course already exists." });
        } 
        User.findAll({ where: { emailAddress: credentials.name } }).then((user) => {
            req.body.userId = user[0].dataValues.id;
            console.log(req.body);
        }).then(() => {
            Course.create(req.body).then(course => {
                res.status(201).redirect(`/api/courses/${course.dataValues.id}`);
            });
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
    const credentials = auth(req);


    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);

        return res.status(400).json({ errors: errorMessages });
        }
        Course.findByPk(req.params.id).then(async (course) => {
            if (course) {
                await User.findAll({ where: { emailAddress: credentials.name } }).then((user) => {
                    console.log(course);
                    if (user[0].dataValues.id === course.dataValues.userId) {
                        course.update(req.body);
                        res.status(204).end();
                    } else {
                        res.status(403).end();
                    }
                });
            }
        });
});

router.delete('/courses/:id', authenticateUser, (req, res) => {
    const credentials = auth(req);

    Course.findByPk(req.params.id).then(async course => {
        if (course) {
            await User.findAll({ where: { emailAddress: credentials.name } }).then((user) => {
                console.log(course);
                if (user[0].dataValues.id === course.dataValues.userId) {
                    course.destroy();
                    res.status(204).end();
                } else {
                    res.status(403).end();
                }
            });
        } else {
            res.status(500).end();
        }
    });
});

module.exports = router;