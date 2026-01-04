const express = require('express');
const router = express.Router();
const Person = require('../models/Person');
const auth = require('../middleware/auth');

// GET /api/people - List all people
router.get('/', auth, async (req, res) => {
    try {
        const people = await Person.find({ is_hidden: false }).sort({ face_count: -1 });
        res.json(people);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /api/people/:id - Get specific person details
router.get('/:id', auth, async (req, res) => {
    try {
        const person = await Person.findOne({ person_id: req.params.id });
        if (!person) return res.status(404).json({ message: 'Person not found' });
        res.json(person);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// PATCH /api/people/:id - Rename person
router.patch('/:id', auth, async (req, res) => {
    const { name } = req.body;
    try {
        const person = await Person.findOneAndUpdate(
            { person_id: req.params.id },
            { name: name },
            { new: true }
        );
        res.json(person);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
