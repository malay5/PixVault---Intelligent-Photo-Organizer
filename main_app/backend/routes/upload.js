const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Picture = require('../models/Picture');
// const { processImage } = require('../services/mlService'); // TODO

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// POST /api/upload
router.post('/', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Create Picture record
        // Mock user ID for now or get from auth middleware
        const userId = "60d0fe4f5311236168a109ca"; // Dummy ID

        // Mock Storage Limit (15GB in text, but let's say 10MB for testing/demo)
        // Check current usage
        const MAX_STORAGE_BYTES = 10 * 1024 * 1024; // 10MB
        const userPictures = await Picture.find({ user_id: userId });
        const currentUsage = userPictures.reduce((acc, pic) => acc + (pic.metadata.size || 0), 0);

        if (currentUsage + req.file.size > MAX_STORAGE_BYTES) {
            return res.status(400).json({ message: 'Storage limit exceeded (10MB Mock Limit)' });
        }

        const newPicture = new Picture({
            user_id: userId,
            file_path: req.file.path,
            original_name: req.file.originalname,
            metadata: {
                size: req.file.size
            }
        });

        await newPicture.save();

        // Trigger ML processing (Async)
        // In a real app, this would be a job queue. Here we just call it.
        processImage(newPicture._id, req.file.path);

        res.status(201).json({ message: 'Image uploaded successfully', picture: newPicture });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function processImage(pictureId, filePath) {
    try {
        console.log(`Processing image: ${pictureId}`);
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));

        // Call ML Service (Assuming it's running on port 8000)
        // Python/FastAPI default is 8000
        const mlResponse = await axios.post('http://localhost:8000/process-image', formData, {
            headers: {
                ...formData.getHeaders()
            }
        });

        const { faces } = mlResponse.data;
        console.log(`Detected ${faces.length} faces for ${pictureId}`);

        // Update Picture with detected faces
        const picture = await Picture.findById(pictureId);

        // Map ML faces to DB structure
        const dbFaces = faces.map(f => ({
            face_id: f.face_id,
            box: f.box,
            person_id: null // Initially null, logic to assign person_id comes later (clustering)
        }));

        picture.faces = dbFaces;
        await picture.save();
        console.log(`Updated picture ${pictureId} with faces`);

    } catch (err) {
        console.error('ML Processing Error:', err.message);
    }
}


module.exports = router;
