const mongoose = require('mongoose');

const faceSchema = new mongoose.Schema({
    face_id: { type: String, required: true },
    box: {
        x: Number,
        y: Number,
        w: Number,
        h: Number
    },
    person_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' }
});

const pictureSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    file_path: { type: String, required: true },
    original_name: { type: String },
    upload_date: { type: Date, default: Date.now },
    faces: [faceSchema],
    metadata: {
        width: Number,
        height: Number,
        size: Number,
        camera_model: String,
        software: String
    },
    is_ai: { type: Boolean, default: false },
    is_favorite: { type: Boolean, default: false },
    album_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Album' }],
    // Guest / Party Mode Tracking
    guest_uploaded_by: { type: String },
    guest_email: { type: String },
    // New Fields for Archive/Trash Logic
    status: {
        type: String,
        enum: ['active', 'trash', 'archive'],
        default: 'active'
    },
    deletedAt: { type: Date } // For 60-day auto-delete logic
});

module.exports = mongoose.model('Picture', pictureSchema);
