const express = require('express');
const router = express.Router();
const Picture = require('../models/Picture');
const auth = require('../middleware/auth');

// @route   PUT api/photos/status
// @desc    Update status (active/trash/archive) for multiple photos
// @access  Private
router.put('/status', auth, async (req, res) => {
    const { photoIds, status } = req.body; // Expects { photoIds: [1, 2], status: 'trash' }

    const path = require('path');
    const fs = require('fs');

    if (!['active', 'trash', 'archive', 'delete_permanent'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        if (status === 'delete_permanent') {
            const photosToDelete = await Picture.find({ _id: { $in: photoIds }, user_id: req.user.id });

            for (const photo of photosToDelete) {
                // Delete file from filesystem
                if (photo.file_path) {
                    // Check if path is absolute or relative
                    // Our uploads are usually absolute or relative to root?
                    // Database stores: 'uploads/file.jpg' (relative) OR absolute depending on old code.
                    // Let's resolve safely.
                    // Typically d:/.../uploads/file.jpg from upload.js
                    try {
                        const safePath = path.resolve(photo.file_path);
                        if (fs.existsSync(safePath)) {
                            fs.unlinkSync(safePath);
                        } else {
                            // Try relative to project root if absolute failed
                            const relativePath = path.join(__dirname, '..', '..', photo.file_path);
                            if (fs.existsSync(relativePath)) {
                                fs.unlinkSync(relativePath);
                            }
                        }
                    } catch (err) {
                        console.error(`Failed to delete file for photo ${photo._id}`, err);
                    }
                }
                await Picture.deleteOne({ _id: photo._id });
            }
            return res.json({ message: `Permanently deleted ${photosToDelete.length} photos` });
        }

        const updateData = { status };
        if (status === 'trash') {
            updateData.deletedAt = Date.now();
        } else {
            updateData.deletedAt = null; // Reset if restoring or archiving
        }

        // Update all photos where ID is in photoIds AND user owns them (security)
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
    const { status, person_id } = req.query;
    const filter = { user_id: req.user.id };

    // If status is provided and not 'all', filter by it.
    // If status is 'all', do not filter by status (return all).
    // If status is NOT provided, default to 'active' (for backward compatibility)
    if (status && status !== 'all') {
        filter.status = status;
    } else if (!status) {
        filter.status = 'active';
    }

    // Filter by Person ID (Look inside faces array)
    if (person_id) {
        filter['faces.person_id'] = person_id;
    }

    try {
        const photos = await Picture.find(filter).sort({ upload_date: -1 });
        res.json(photos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/photos/:id/favorite
// @desc    Toggle favorite status of a photo
// @access  Private
router.put('/:id/favorite', auth, async (req, res) => {
    try {
        const photo = await Picture.findOne({ _id: req.params.id, user_id: req.user.id });

        if (!photo) {
            return res.status(404).json({ message: 'Photo not found' });
        }

        photo.is_favorite = !photo.is_favorite;
        await photo.save();

        res.json(photo);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/photos/copy
// @desc    Deep Copy photos to another album (Save to Library)
// @access  Private
router.post('/copy', auth, async (req, res) => {
    const { photoIds, targetAlbumId, newAlbumName } = req.body;
    const fs = require('fs');
    const path = require('path');
    const Album = require('../models/Album'); // Import Album model

    try {
        let destinationAlbumId = targetAlbumId;

        // If new album requested
        if (newAlbumName) {
            const newAlbum = new Album({
                user_id: req.user.id,
                name: newAlbumName,
                description: "Imported from Shared Album"
            });
            await newAlbum.save();
            destinationAlbumId = newAlbum._id;
        } else if (!destinationAlbumId) {
            // Fallback: "My Images"
            let myImages = await Album.findOne({ user_id: req.user.id, name: "My Images" });
            if (!myImages) {
                // Should exist due to Auth change, but safe fallback
                myImages = new Album({ user_id: req.user.id, name: "My Images" });
                await myImages.save();
            }
            destinationAlbumId = myImages._id;
        }

        // Process Photos
        const results = [];
        const originalPhotos = await Picture.find({ _id: { $in: photoIds } });

        for (const original of originalPhotos) {
            // Physical Copy
            const originalPath = path.resolve(original.file_path);
            if (fs.existsSync(originalPath)) {
                const ext = path.extname(original.file_path);
                const newFilename = Date.now() + Math.floor(Math.random() * 1000) + ext;
                const newRelativePath = path.join('uploads', newFilename);
                const newAbsolutePath = path.resolve(__dirname, '..', '..', 'uploads', newFilename); // Assuming uploads is in root

                // Ensure uploads dir exists (should exist)
                fs.copyFileSync(originalPath, newAbsolutePath);

                const newPicture = new Picture({
                    user_id: req.user.id, // New Owner
                    file_path: newRelativePath,
                    original_name: original.original_name,
                    album_ids: [destinationAlbumId],
                    status: 'active',
                    metadata: original.metadata,
                    faces: original.faces // Copy face data too? Yes, useful.
                });
                await newPicture.save();
                results.push(newPicture._id);
            }
        }

        res.json({ message: `Successfully copied ${results.length} photos`, copied_ids: results, target_album_id: destinationAlbumId });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

// @route   POST api/photos/:id/report
// @desc    Report an AI False Positive
// @access  Private
router.post('/:id/report', auth, async (req, res) => {
    try {
        const { reason } = req.body;
        const photo = await Picture.findById(req.params.id);

        if (!photo) {
            return res.status(404).json({ message: 'Photo not found' });
        }

        // Add report
        photo.reports.push({
            user_id: req.user.id,
            reason: reason || 'False Positive'
        });

        await photo.save();
        res.json({ message: 'Report submitted successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
