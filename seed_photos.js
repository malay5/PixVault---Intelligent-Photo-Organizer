const mongoose = require('mongoose');
const Picture = require('./main_app/backend/models/Picture');

// Connect to DB
const db = process.env.MONGODB_URI || "mongodb+srv://malay:malay@cluster0.b7e8p.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0"; // Hardcoded for script simplicity based on previous context

const seed = async () => {
    try {
        await mongoose.connect(db);
        console.log('MongoDB Connected');

        // Find the user
        // We know the user email is testverify@example.com from previous steps
        // But we don't have the User model imported here easily without file path issues.
        // Let's just create a generic picture with a hardcoded user ID if we can find it.
        // Wait, I can fetch the user by email if I import User model.

        const User = require('./main_app/backend/models/User');
        const user = await User.findOne({ email: 'testverify@example.com' });

        if (!user) {
            console.error('User not found');
            process.exit(1);
        }

        console.log('Found user:', user._id);

        const newPic = new Picture({
            user_id: user._id,
            file_path: 'uploads/dummy_test_image.jpg', // Dummy path
            original_name: 'test_photo.jpg',
            metadata: { size: 1024, width: 800, height: 600 },
            status: 'active'
        });

        await newPic.save();
        console.log('Seeded photo:', newPic._id);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed();
