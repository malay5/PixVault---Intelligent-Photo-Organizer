const mongoose = require('mongoose');

const PersonSchema = new mongoose.Schema({
    person_id: { type: String, required: true, unique: true }, // ML generated ID
    name: { type: String, default: "Unknown" },
    thumbnail_url: { type: String }, // URL to the face crop (from ML)
    face_count: { type: Number, default: 0 },
    is_hidden: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Person', PersonSchema);
