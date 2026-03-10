const express = require('express');
const Donation = require('../models/Donation');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/impact — global impact stats
router.get('/', async (req, res) => {
    try {
        const totalDelivered = await Donation.countDocuments({ status: 'Delivered' });
        const totalWeight = await Donation.aggregate([
            { $match: { status: 'Delivered' } },
            { $group: { _id: null, total: { $sum: '$weightInKg' } } }
        ]);

        const totalKg = totalWeight.length > 0 ? totalWeight[0].total : 0;
        const co2Saved = totalKg * 2.5;

        // Monthly breakdown (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyBreakdown = await Donation.aggregate([
            {
                $match: {
                    status: 'Delivered',
                    deliveredAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$deliveredAt' },
                        month: { $month: '$deliveredAt' }
                    },
                    meals: { $sum: 1 },
                    weightKg: { $sum: '$weightInKg' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const formatted = monthlyBreakdown.map(m => ({
            month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
            meals: m.meals,
            weightKg: m.weightKg,
            co2Saved: m.weightKg * 2.5
        }));

        res.json({
            mealsSaved: totalDelivered,
            totalWeightKg: totalKg,
            co2Saved,
            monthlyBreakdown: formatted
        });
    } catch (err) {
        console.error('Impact stats error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/impact/user — user-specific impact stats
router.get('/user', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        const userDonations = await Donation.find({
            $or: [
                { donor: req.user.id, status: 'Delivered' },
                { claimedBy: req.user.id, status: 'Delivered' }
            ]
        });

        const mealsSaved = userDonations.length;
        const totalKg = userDonations.reduce((sum, d) => sum + (d.weightInKg || 1), 0);

        // Determine badge
        let badge = 'Newcomer';
        if (mealsSaved >= 100) badge = 'Food Hero';
        else if (mealsSaved >= 50) badge = 'Champion';
        else if (mealsSaved >= 20) badge = 'Contributor';
        else if (mealsSaved >= 5) badge = 'Supporter';

        res.json({
            mealsSaved,
            totalWeightKg: totalKg,
            co2Saved: totalKg * 2.5,
            badge,
            totalDonations: user.totalDonations,
            totalReceived: user.totalReceived
        });
    } catch (err) {
        console.error('User impact error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
