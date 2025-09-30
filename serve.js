const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

// @route   POST /api/reports
// @desc    Citizen submits a new problem report
// @access  Public
router.post('/', async (req, res) => {
    try {
        console.log('Received report submission:', req.body);
        
        const { title, description, category, latitude, longitude, userId } = req.body;

        const newReport = {
            title,
            description,
            category: category || 'Other',
            location: new admin.firestore.GeoPoint(
                parseFloat(latitude), 
                parseFloat(longitude)
            ),
            userId: userId || 'anonymous',
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            imageUrl: ''
        };

        const reportRef = await db.collection('reports').add(newReport);
        console.log('Report saved with ID:', reportRef.id);

        res.status(201).json({
            success: true,
            message: 'Report submitted successfully!',
            reportId: reportRef.id
        });

    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error. Could not submit report.' 
        });
    }
});

// @route   GET /api/reports
// @desc    Get all reports
// @access  Public
router.get('/', async (req, res) => {
    try {
        console.log('Fetching reports from Firestore...');
        
        // SIMPLIFIED: Get all documents without any ordering
        const reportsSnapshot = await db.collection('reports').get();
        
        const reports = [];
        
        reportsSnapshot.forEach(doc => {
            const data = doc.data();
            reports.push({ 
                id: doc.id, 
                ...data
            });
        });

        console.log('Found ${reports.length} reports');
        res.json({ success: true, reports: reports });

    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error: ' + error.message 
        });
    }
});

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'Reports API endpoint is working!' });
});

module.exports = router;