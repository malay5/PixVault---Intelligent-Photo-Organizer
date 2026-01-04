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
const sizeOf = require('image-size').default || require('image-size'); // Handle version differences safe

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
            // Fix path resolution: req.file.path is relative to root (e.g. 'uploads/file.jpg')
            // absoluteFilePath needs to be correct.
            // If running from backend/server.js, __dirname is backend/.
            // '..' goes to main_app/. 'uploads/' is likely in main_app/backend/uploads or main_app/uploads?
            // Multer saves to 'uploads/' relative to CWD.
            // If CWD is backend/, then uploads/ is in backend/.

            // Let's rely on req.file.path directly if CWD is correct, or resolve safely.
            const imageBuffer = fs.readFileSync(req.file.path);
            dimensions = sizeOf(imageBuffer);
            console.log(`Calculated Dimensions: ${dimensions.width}x${dimensions.height}`);

            // EXIF Parsing
            // EXIF Parsing (Only for JPEGs)
            if (dimensions.type === 'jpg' || dimensions.type === 'jpeg') {
                try {
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
                } catch (exifErr) {
                    console.log('EXIF parsing failed (harmless):', exifErr.message);
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

        // Trigger ML processing (Async Trigger)
        // We await the trigger call, but the ML service returns immediately.
        await triggerML(newPicture._id, req.file.path);

        res.status(201).json({ message: 'Image uploaded successfully', picture: newPicture });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Callbacks from ML Service
router.post('/callback/ai', async (req, res) => {
    try {
        const { picture_id, is_ai } = req.body;
        console.log(`Received AI Callback for ${picture_id}: ${is_ai}`);

        await Picture.findByIdAndUpdate(picture_id, { is_ai: is_ai });
        res.json({ status: 'ok' });
    } catch (err) {
        console.error('AI Callback Error', err);
        res.status(500).json({ message: 'Error updating AI status' });
    }
});

// Import Person model
const Person = require('../models/Person');

const fs = require('fs');
// path is already imported at the top of the file.

router.post('/callback/faces', async (req, res) => {
    try {
        const { picture_id, faces } = req.body;
        console.log(`Received Face Callback for ${picture_id}: ${faces.length} faces`);

        const dbFaces = [];

        // Ensure thumbnails directory exists
        const thumbDir = path.join(__dirname, '..', 'uploads', 'thumbnails');
        if (!fs.existsSync(thumbDir)) {
            fs.mkdirSync(thumbDir, { recursive: true });
        }

        for (const f of faces) {
            let avatarUrl = f.avatar_url; // Default if old ML

            // Handle Base64 Avatar from ML (New Logic)
            if (f.avatar_b64 && f.person_id) {
                // Determine logic: Save if new identity OR if we decide to overwrite (user said "use first image")
                // We'll check if Person exists below. For now, let's prepare the potential file path.
                // Actually, efficient logic: Check person first.
            }

            // Logic moved inside Person check for optimization

            // 2. Update Person Collection (Upsert or Update Stats)
            if (f.person_id) {
                let person = await Person.findOne({ person_id: f.person_id });

                if (!person) {
                    // Create New Person

                    // SAVE THUMBNAIL
                    if (f.avatar_b64) {
                        const filename = `${f.person_id}.jpg`;
                        const filePath = path.join(thumbDir, filename);
                        fs.writeFileSync(filePath, Buffer.from(f.avatar_b64, 'base64'));
                        avatarUrl = `/uploads/thumbnails/${filename}`; // Relative URL for frontend
                        console.log(`Saved thumbnail for new ${f.person_id}`);
                    }

                    person = new Person({
                        person_id: f.person_id,
                        name: f.name || "Unknown",
                        thumbnail_url: avatarUrl,
                        face_count: 1
                    });
                    await person.save();
                    console.log(`Created new person: ${f.name} (${f.person_id})`);
                } else {
                    // Update stats
                    person.face_count += 1;

                    // Update thumbnail ONLY if missing (User said: "Just use the first image... if detached randomly choose")
                    if (!person.thumbnail_url && f.avatar_b64) {
                        const filename = `${f.person_id}.jpg`;
                        const filePath = path.join(thumbDir, filename);
                        fs.writeFileSync(filePath, Buffer.from(f.avatar_b64, 'base64'));
                        person.thumbnail_url = `/uploads/thumbnails/${filename}`;
                        avatarUrl = person.thumbnail_url;
                        console.log(`Updated missing thumbnail for ${f.person_id}`);
                    } else if (person.thumbnail_url) {
                        // Use existing thumbnail for consistency in this Picture record too?
                        // The user said "the thumbnail for each user could be different for the same person's image" -- Wait.
                        // User said: "(the thumbnail for each user could be different for the same person's image)" -> confusing.
                        // Then said: "Just use the first image... as ITS thumbnail." 
                        // I think they meant "The thumbnail representative OF THE PERSON".
                        // So I should typically use the Person's thumbnail for the UI (Avatar).

                        // BUT, for the "Face Box" on the specific photo, we might want THAT crop?
                        // No, the UI uses the full image and draws a box. 
                        // The `avatar_url` on `Picture.faces` is used... where? 
                        // In `app/photos/[id]`, I used `face.avatar_url`.
                        // If I want the `Picture.faces` to have the specific crop of THAT face, I should save it every time?
                        // "The same place... with name of thumbnails folder... is stored... Just use the first image... as ITS thumbnail"
                        // This implies "Person Thumbnail" = First Image.
                        // It does NOT imply saving a crop for every single face occurrence.

                        // So, `face.avatar_url` in `Picture` should probably point to `Person.thumbnail_url`?
                        // OR, if I want to show the specific face in the list, I'd need to save it.
                        // Current UI: Shows an avatar in the list.
                        // If I don't save every crop, I can't show unique avatars per face in the list.
                        // I will use `Person.thumbnail_url` as the fallback/primary.
                        avatarUrl = person.thumbnail_url;
                    }

                    await person.save();
                }
            }

            // 1. Prepare Face Object for Picture
            const faceObj = {
                face_id: f.face_id,
                box: f.box,
                person_id: f.person_id,
                name: f.name || "Unknown",
                avatar_url: avatarUrl // This will now point to the Person's reference thumbnail (or specific if we changed logic)
            };
            dbFaces.push(faceObj);
        }

        await Picture.findByIdAndUpdate(picture_id, { faces: dbFaces });
        res.json({ status: 'ok' });
    } catch (err) {
        console.error('Face Callback Error', err);
        res.status(500).json({ message: 'Error updating faces' });
    }
});


// const fs = require('fs');
const FormData = require('form-data');

async function triggerML(pictureId, filePath) {
    try {
        console.log(`Triggering ML for: ${pictureId}`);
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));
        formData.append('picture_id', pictureId.toString());

        // Call ML Service Trigger Endpoint
        await axios.post('http://localhost:8000/trigger-processing', formData, {
            headers: {
                ...formData.getHeaders()
            }
        });
        console.log(`ML Triggered for ${pictureId}`);
    } catch (err) {
        console.error('ML Trigger Error:', err.message);
    }
}


module.exports = router;
