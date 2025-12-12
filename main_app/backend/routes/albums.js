const express = require('express');
const router = express.Router();
const Album = require('../models/Album');
const auth = require('../middleware/auth');

// @route   GET api/albums
// @desc    Get all user's albums
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const albums = await Album.find({ user_id: req.user.id }).sort({ date: -1 });
        res.json(albums);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/albums
// @desc    Create new album
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { name } = req.body;
        const newAlbum = new Album({
            name,
            user_id: req.user.id
        });
        const album = await newAlbum.save();
        res.json(album);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
