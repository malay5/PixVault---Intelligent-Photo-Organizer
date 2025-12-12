const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    is_user_assigned: { type: Boolean, default: false },
    representative_face_id: { type: String }, // To show a thumbnail
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Person', personSchema);
