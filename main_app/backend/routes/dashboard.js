const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Picture = require('../models/Picture');
const User = require('../models/User'); // Assuming User model exists
// const mlService = require('../services/mlService'); // Or direct axios check

// @route   GET api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Public (or Private if you want to restrict it)
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalPhotos = await Picture.countDocuments({ status: 'active' });

        // Count reports (aggregation or simple count if we iterate, but aggregation is better)
        // Count photos that have reports array size > 0
        const reportedIssues = await Picture.countDocuments({ 'reports.0': { $exists: true } });

        // Total Storage (Sum of metadata.size)
        const storageAgg = await Picture.aggregate([
            { $group: { _id: null, totalSize: { $sum: "$metadata.size" } } }
        ]);
        const totalStorageBytes = storageAgg.length > 0 ? storageAgg[0].totalSize : 0;

        // Processed Images (Have faces or is_ai flag set? Or just general count?)
        // Let's say processed = faces detected OR is_ai true (implying processing ran)
        const processedImages = await Picture.countDocuments({
            $or: [{ 'faces.0': { $exists: true } }, { is_ai: true }]
        });

        res.json({
            users: totalUsers,
            photos: totalPhotos,
            reported_issues: reportedIssues,
            storage_bytes: totalStorageBytes,
            processed_images: processedImages
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/dashboard/health
// @desc    Get system health status
router.get('/health', async (req, res) => {
    // 1. Database Check
    const dbStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'degraded';

    // 2. ML Service Check (Ping)
    // Assume ML Service runs on localhost:8000
    let mlStatus = 'unknown';
    const axios = require('axios');
    try {
        await axios.get('http://localhost:8000/');
        mlStatus = 'healthy';
    } catch (e) {
        mlStatus = 'unreachable';
    }

    res.json({
        backend: 'healthy',
        database: dbStatus,
        ml_service: mlStatus
    });
});

// @route   GET api/dashboard/latency
// @desc    Get system latency metrics (Mock for now)
router.get('/latency', async (req, res) => {
    // Return mock data for the last 24 hours (or just 1 hour of points)
    const data = [];
    const now = Date.now();
    for (let i = 20; i >= 0; i--) {
        data.push({
            time: new Date(now - i * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            avg_latency: Math.floor(Math.random() * 50) + 20, // 20-70ms
            p95_latency: Math.floor(Math.random() * 100) + 50 // 50-150ms
        });
    }
    res.json(data);
});

module.exports = router;
