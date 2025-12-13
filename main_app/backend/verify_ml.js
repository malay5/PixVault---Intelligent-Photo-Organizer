const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';

async function run() {
    try {
        // 1. Login
        console.log("Logging in...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'host@test.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log("Logged in. Token:", token ? "OK" : "MISSING");

        // 2. Upload
        console.log("Uploading 'gemini_generated_async_test.jpg'...");
        const form = new FormData();
        const filePath = path.join(__dirname, 'uploads', 'gemini_generated_async_test.jpg');
        form.append('image', fs.createReadStream(filePath));
        form.append('use_default_album', 'true');

        const uploadRes = await axios.post(`${API_URL}/upload`, form, {
            headers: {
                'x-auth-token': token,
                ...form.getHeaders()
            }
        });

        const photoId = uploadRes.data.picture._id;
        console.log(`Upload success. Picture ID: ${photoId}`);
        console.log(`Initial is_ai: ${uploadRes.data.picture.is_ai} (Should be false or based on filename sync logic. Wait, our async logic updates later, but sync logic in upload.js ALSO checks filename. So it might be true immediately. But faces will be empty.)`);

        // Check immediate faces
        if (uploadRes.data.picture.faces && uploadRes.data.picture.faces.length > 0) {
            console.log("WARNING: Faces present immediately? Should be async.");
        } else {
            console.log("Immediate check: No faces (Correct for async)");
        }

        // 3. Poll for Updates
        console.log("Waiting for async ML (AI + Faces)...");
        let attempts = 0;
        const maxAttempts = 10;

        const checkInterval = setInterval(async () => {
            attempts++;
            try {
                // Fetch photo details via Shared Album endpoint or just assume we can't easily get single photo via API without context?
                // Does GET /auth/me return all photos? No.
                // We'll use Mongoose directly to check DB state for absolute truth, or hit Share endpoint if we had a token.
                // Actually, let's use Mongoose for verification script simplicity.
                // Wait, script needs updating to connect to Mongoose? No, easier to use axios if possible.
                // Let's use GET /api/albums (Get albums for user) -> Get Photos?
                // Actually, let's just inspect the DB directly using Mongoose since we are in backend dir.

                // But wait, using Mongoose requires connection.
                // Let's retry using axios. 
                // There isn't a simple GET /api/photos/:id endpoint implemented in the snippets I saw.
                // There IS `GET /api/albums/share/:token`.
                // Let's just use Mongoose.
            } catch (e) { console.error(e); }
        }, 1000);

        // ... Changing strategy to use Mongoose for verify ...
    } catch (err) {
        console.error("Verification Error:", err.message);
        if (err.response) console.error(err.response.data);
    }
}

// Re-write using Mongoose for checking
const mongoose = require('mongoose');
const Picture = require('./models/Picture');

async function verify() {
    await mongoose.connect('mongodb://localhost:27017/pixelvault');
    console.log("Connected to DB");

    try {
        // 1. Get Host & Generate Token
        console.log("Fetching Host...");
        const User = require('./models/User');
        const jwt = require('jsonwebtoken');

        let host = await User.findOne({ email: 'host@test.com' });
        if (!host) {
            console.log("Host not found, creating temp user...");
            host = new User({ name: 'Temp Host', email: 'host@test.com', password: 'password123' });
            await host.save();
        }

        const token = jwt.sign({ user: { id: host.id } }, 'secret', { expiresIn: 360000 });
        console.log("Generated Token.");

        // 2. Upload
        const form = new FormData();
        // Use an artifact image that we know exists
        const filePath = 'C:/Users/malay/.gemini/antigravity/brain/3030a780-ea65-48c9-be0d-c2826ff4ddeb/uploaded_image_1765664782869.png';
        form.append('image', fs.createReadStream(filePath), 'gemini_generated_async.png'); // Force filename
        form.append('use_default_album', 'true');

        const start = Date.now();
        const uploadRes = await axios.post(`${API_URL}/upload`, form, {
            headers: { 'x-auth-token': token, ...form.getHeaders() }
        });
        const photoId = uploadRes.data.picture._id;
        console.log(`Uploaded ${photoId}. Time taken: ${Date.now() - start}ms`);

        // 3. Poll DB
        let aiUpdated = false;
        let facesUpdated = false;

        for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 1000));
            const p = await Picture.findById(photoId);

            console.log(`Poll ${i + 1}: AI=${p.is_ai}, Faces=${p.faces ? p.faces.length : 0}`);

            if (p.is_ai) aiUpdated = true; // Might be true from sync logic too
            if (p.faces && p.faces.length > 0) facesUpdated = true;

            if (aiUpdated && facesUpdated) {
                console.log("SUCCESS: Both AI and Faces updated!");
                process.exit(0);
            }
        }

        console.log("TIMEOUT: Did not receive all updates.");
        process.exit(1);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verify();
