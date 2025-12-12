const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String },
    cover_photo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Picture' },
    created_at: { type: Date, default: Date.now },
    is_shared: { type: Boolean, default: false },
    shared_link: { type: String }
});

module.exports = mongoose.model('Album', albumSchema);
