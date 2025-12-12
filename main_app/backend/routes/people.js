const express = require('express');
const router = express.Router();
const Person = require('../models/Person');
const auth = require('../middleware/auth');

// @route   GET api/people
// @desc    Get all people
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const people = await Person.find({ user_id: req.user.id });
        res.json(people);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
