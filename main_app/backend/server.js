require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pixelvault', {
    // useNewUrlParser: true, // Deprecated in newer drivers but harmless
    // useUnifiedTopology: true // Deprecated in newer drivers but harmless
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/albums', require('./routes/albums'));
app.use('/api/people', require('./routes/people'));
app.use('/api/photos', require('./routes/photos'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
