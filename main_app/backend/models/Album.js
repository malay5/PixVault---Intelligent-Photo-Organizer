const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String },
    cover_photo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Picture' },
    created_at: { type: Date, default: Date.now },
    is_shared: { type: Boolean, default: false },
    shared_link: { type: String }, // Legacy/Frontend URL
    token: { type: String, unique: true, sparse: true }, // Unique share token
    read_only_token: { type: String, unique: true, sparse: true }, // Token for read-only access
    party_mode: { type: Boolean, default: false },
    allow_guest_uploads: { type: Boolean, default: false },
    accessed_by: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who have accessed this album
    deleted_at: { type: Date, default: null } // Soft Delete
});

module.exports = mongoose.model('Album', albumSchema);
