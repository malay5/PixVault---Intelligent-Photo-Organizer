const mongoose = require('mongoose');
const User = require('./models/User');
const Album = require('./models/Album');
const crypto = require('crypto');

mongoose.connect('mongodb://localhost:27017/pixelvault')
    .then(async () => {
        console.log("Connected");

        // 1. Create Host
        let host = await User.findOne({ email: 'host@test.com' });
        if (!host) {
            host = new User({ name: 'Host Test', email: 'host@test.com', password: 'password123' });
            await host.save();
            console.log("Created Host");
            // Create My Images for Host
            await new Album({ name: "My Images", user_id: host._id }).save();
        } else {
            console.log("Host exists");
        }

        // 1.5 Create Guest
        let guest = await User.findOne({ email: 'guest@test.com' });
        if (!guest) {
            guest = new User({ name: 'Guest Test', email: 'guest@test.com', password: 'password123' });
            await guest.save();
            // Create My Images for Guest
            await new Album({ name: "My Images", user_id: guest._id }).save();
            console.log("Created Guest");
        } else {
            console.log("Guest exists");
        }

        // 2. Create Album
        let album = await Album.findOne({ name: 'Verification Party', user_id: host._id });
        if (!album) {
            album = new Album({
                name: 'Verification Party',
                user_id: host._id,
                party_mode: true,
                is_shared: true,
                allow_guest_uploads: true,
                token: crypto.randomBytes(8).toString('hex')
            });
            await album.save();
            console.log("Created Album");
        } else {
            // Ensure permissions
            album.party_mode = true;
            album.is_shared = true;
            if (!album.token) album.token = require('crypto').randomBytes(8).toString('hex');
            if (!album.read_only_token) album.read_only_token = require('crypto').randomBytes(8).toString('hex');
            await album.save();
            console.log("Updated Album");
        }

        // 3. Create Test AI Photo
        const Picture = require('./models/Picture');
        let pic = await Picture.findOne({ original_name: 'Test AI Photo.jpg' });
        if (!pic) {
            pic = new Picture({
                user_id: host._id,
                file_path: 'uploads/test_ai_photo.jpg',
                original_name: 'Test AI Photo.jpg',
                album_ids: [album._id],
                is_ai: true,
                metadata: {
                    width: 800,
                    height: 600,
                    size: 1024,
                    camera_model: 'Imaginary AI Gen 1.0',
                    software: 'Stable Diffusion XL'
                }
            });
            await pic.save();
            await pic.save();
            console.log("Created Test AI Photo");
        }

        // 4. Create Normal Photo (Unknown Camera)
        let pic2 = await Picture.findOne({ original_name: 'gemini_generated_test.jpg' });
        if (!pic2) {
            pic2 = new Picture({
                user_id: host._id,
                file_path: 'uploads/test_ai_photo.jpg', // Reuse file
                original_name: 'gemini_generated_test.jpg',
                album_ids: [album._id],
                is_ai: true,
                metadata: {
                    width: 800,
                    height: 600,
                    size: 1024,
                    camera_model: 'Unknown Camera',
                    software: 'Google'
                }
            });
            await pic2.save();
            console.log("Created Unknown Camera Photo");
        }

        console.log(`SHARE TOKEN: ${album.token}`);
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
