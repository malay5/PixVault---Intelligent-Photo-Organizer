const express = require('express');
const router = express.Router();
const Picture = require('../models/Picture');
const auth = require('../middleware/auth');

// @route   PUT api/photos/status
// @desc    Update status (active/trash/archive) for multiple photos
// @access  Private
router.put('/status', auth, async (req, res) => {
    const { photoIds, status } = req.body; // Expects { photoIds: [1, 2], status: 'trash' }

    if (!['active', 'trash', 'archive'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const updateData = { status };
        if (status === 'trash') {
            updateData.deletedAt = Date.now();
        } else {
            updateData.deletedAt = null; // Reset if restoring or archiving
        }

        // Update all photos where ID is in photoIds AND user owns them (security)
        // Note: pictureSchema uses _id, but frontend might send generic IDs. Assuming _id here.
        // If frontend sends 'id' verify mapping.
        await Picture.updateMany(
            { _id: { $in: photoIds }, user_id: req.user.id },
            { $set: updateData }
        );

        res.json({ message: `Updated ${photoIds.length} photos to ${status}` });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/photos
// @desc    Get all photos for user (with optional status filter)
// @access  Private
router.get('/', auth, async (req, res) => {
    const { status } = req.query;
    const filter = { user_id: req.user.id };

    // Default to 'active' if no status provided? 
    // Usually main grid shows active. Trash shows trash.
    if (status) {
        filter.status = status;
    } else {
        // match behavior of legacy Grid if needed, or default to all? 
        // Best practice: Default to 'active' to hide trash/archive from main feed
        filter.status = 'active';
    }

    try {
        const photos = await Picture.find(filter).sort({ upload_date: -1 });
        res.json(photos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
