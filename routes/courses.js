
const express = require('express');
var Course = require('../models').Course;
var User = require('../models').User;

// Construct a router instance.
const router = express.Router();


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



module.exports = router;