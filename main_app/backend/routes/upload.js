const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Picture = require('../models/Picture');
const Album = require('../models/Album');
// const fs = require('fs');
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
const auth = require('../middleware/auth');
const axios = require('axios');
const sizeOf = require('image-size');

// POST /api/upload
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Create Picture record
        // Mock user ID for now or get from auth middleware
        const userId = req.user.id;

        // Storage Limit: 1GB Global Limit
        const MAX_STORAGE_BYTES = 1 * 1024 * 1024 * 1024; // 1GB
        const userPictures = await Picture.find({ user_id: userId });
        const currentUsage = userPictures.reduce((acc, pic) => acc + (pic.metadata?.size || 0), 0);

        if (currentUsage + req.file.size > MAX_STORAGE_BYTES) {
            // Delete the temp file if rejected
            const fs = require('fs');
            fs.unlink(req.file.path, () => { });
            return res.status(400).json({ message: 'Storage limit exceeded (10MB Mock Limit)' });
        }
        const fs = require('fs');
        const absoluteFilePath = path.join(__dirname, '..', req.file.path);
        if (!fs.existsSync(absoluteFilePath)) {
            console.error('File not found at absolute path:', absoluteFilePath);
            // You might want to return an error here instead of continuing
        }


        // Extract Dimensions & EXIF
        let dimensions = { width: 0, height: 0 };
        let exifData = {};
        let cameraModel = null;
        let software = null;
        let isAi = false;

        try {
            const imageBuffer = fs.readFileSync(absoluteFilePath);
            dimensions = sizeOf(imageBuffer);

            // EXIF Parsing
            const parser = require('exif-parser').create(imageBuffer);
            const result = parser.parse();
            if (result && result.tags) {
                exifData = result.tags;
                cameraModel = exifData.Model || exifData.Make || null;
                software = exifData.Software || null;

                // Simple Heuristic for AI detection via metadata
                if (software && (software.toLowerCase().includes('ai') || software.toLowerCase().includes('diffusion') || software.toLowerCase().includes('dall-e') || software.toLowerCase().includes('midjourney'))) {
                    isAi = true;
                }
            }
        } catch (err) {
            console.error('Error reading image dimensions/EXIF. Full path:', absoluteFilePath);
            console.error('Image Error:', err);
        }

        // Filename Heuristic (User Request)
        if (req.file.originalname && req.file.originalname.toLowerCase().includes('gemini_generated')) {
            isAi = true;
        }

        // Default Album Logic
        let albumIds = req.body.album_id ? [req.body.album_id] : [];
        if (req.body.use_default_album === 'true') {
            // Find or Create "My Images"
            let defaultAlbum = await Album.findOne({ user_id: userId, name: "My Images" });
            if (!defaultAlbum) {
                defaultAlbum = new Album({
                    user_id: userId,
                    name: "My Images",
                    description: "Default collection for your uploads"
                });
                await defaultAlbum.save();
            }
            albumIds.push(defaultAlbum._id);
        }

        const newPicture = new Picture({
            user_id: userId,
            file_path: req.file.path,
            original_name: req.file.originalname,
            status: 'active', // Default explicitly
            album_ids: albumIds,
            is_ai: isAi,
            metadata: {
                size: req.file.size,
                width: dimensions.width,
                height: dimensions.height,
                camera_model: cameraModel,
                software: software
            }
        });

        await newPicture.save();

        // Trigger ML processing (Async)
        // In a real app, this would be a job queue. Here we just call it.
        // processImage(newPicture._id, req.file.path);

        res.status(201).json({ message: 'Image uploaded successfully', picture: newPicture });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

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
