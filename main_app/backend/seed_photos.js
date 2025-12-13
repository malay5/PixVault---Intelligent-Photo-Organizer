const mongoose = require('mongoose');
const Picture = require('./models/Picture');
const User = require('./models/User');

// Connect to DB
const db = process.env.MONGODB_URI || "mongodb+srv://malay:malay@cluster0.b7e8p.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";

const seed = async () => {
    try {
        await mongoose.connect(db);
        console.log('MongoDB Connected');

        const user = await User.findOne({ email: 'testverify@example.com' });

        if (!user) {
            console.error('User not found. Run register_user.js first if needed (though it used fetch).');
            // Create user if not exists?
            /*
            const newUser = new User({ ... });
            await newUser.save();
            */
            // Assuming user exists from previous step
            process.exit(1);
        }

        console.log('Found user:', user._id);

        const newPic = new Picture({
            user_id: user._id,
            file_path: 'uploads/dummy.jpg', // Dummy path
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
