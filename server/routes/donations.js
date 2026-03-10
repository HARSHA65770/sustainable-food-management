const express = require('express');
const Donation = require('../models/Donation');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// POST /api/donations — create a new donation (Donor only)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Donor') {
            return res.status(403).json({ message: 'Only donors can create donations' });
        }

        const { foodType, category, quantity, unit, description, expiryTime, location, address, weightInKg } = req.body;

        const donation = new Donation({
            donor: req.user.id,
            foodType,
            category,
            quantity,
            unit: unit || 'servings',
            description,
            expiryTime: new Date(expiryTime),
            location: {
                type: 'Point',
                coordinates: location.coordinates // [lng, lat]
            },
            address,
            weightInKg: weightInKg || 1
        });

        await donation.save();
        await donation.populate('donor', 'name email rating');

        // Emit socket event for real-time updates
        const io = req.app.get('io');
        if (io) {
            io.emit('newDonation', donation);

            // Notify nearby receivers (within 2km)
            const nearbyReceivers = await User.find({
                role: 'Receiver',
                location: {
                    $nearSphere: {
                        $geometry: {
                            type: 'Point',
                            coordinates: location.coordinates
                        },
                        $maxDistance: 2000 // 2km in meters
                    }
                }
            });

            nearbyReceivers.forEach(receiver => {
                io.to(`user_${receiver._id}`).emit('nearbyDonation', {
                    message: `Fresh food available nearby: ${foodType}`,
                    donation
                });
            });
        }

        // Increment donor's total
        await User.findByIdAndUpdate(req.user.id, { $inc: { totalDonations: 1 } });

        res.status(201).json(donation);
    } catch (err) {
        console.error('Create donation error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// GET /api/donations/nearby — find nearby available donations
router.get('/nearby', async (req, res) => {
    try {
        const { lng, lat, radius = 5000 } = req.query; // radius in meters, default 5km

        if (!lng || !lat) {
            return res.status(400).json({ message: 'Longitude and latitude are required' });
        }

        const now = new Date();

        // Auto-expire donations that have passed their expiry time
        await Donation.updateMany(
            { status: 'Available', expiryTime: { $lt: now } },
            { $set: { status: 'Expired' } }
        );

        const donations = await Donation.find({
            status: 'Available',
            expiryTime: { $gt: now },
            location: {
                $nearSphere: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(radius)
                }
            }
        })
            .populate('donor', 'name email rating')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(donations);
    } catch (err) {
        console.error('Nearby donations error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// GET /api/donations/my — get donor's own donations
router.get('/my', auth, async (req, res) => {
    try {
        const donations = await Donation.find({ donor: req.user.id })
            .populate('claimedBy', 'name email')
            .sort({ createdAt: -1 });
        res.json(donations);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/donations/claimed — get receiver's claimed donations
router.get('/claimed', auth, async (req, res) => {
    try {
        const donations = await Donation.find({ claimedBy: req.user.id })
            .populate('donor', 'name email rating')
            .sort({ claimedAt: -1 });
        res.json(donations);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PATCH /api/donations/:id/claim — claim a donation (Receiver only)
router.patch('/:id/claim', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Receiver') {
            return res.status(403).json({ message: 'Only receivers can claim donations' });
        }

        // Generate 4-digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        // Atomic update: only claim if still Available (prevents conflicts)
        const donation = await Donation.findOneAndUpdate(
            { _id: req.params.id, status: 'Available', expiryTime: { $gt: new Date() } },
            {
                $set: {
                    status: 'Claimed',
                    claimedBy: req.user.id,
                    otp: otp,
                    claimedAt: new Date()
                }
            },
            { new: true }
        ).populate('donor', 'name email rating');

        if (!donation) {
            return res.status(400).json({ message: 'Donation is no longer available or has expired' });
        }

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('donationClaimed', { donationId: donation._id });
            // Notify the donor
            io.to(`user_${donation.donor._id}`).emit('donationClaimed', {
                message: `Your donation "${donation.foodType}" has been claimed!`,
                donation
            });
        }

        res.json({ donation, otp });
    } catch (err) {
        console.error('Claim error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// PATCH /api/donations/:id/verify — verify OTP to complete delivery
router.patch('/:id/verify', auth, async (req, res) => {
    try {
        const { otp } = req.body;
        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({ message: 'Donation not found' });
        }

        if (donation.status !== 'Claimed') {
            return res.status(400).json({ message: 'Donation is not in claimed state' });
        }

        // Only the donor can verify
        if (donation.donor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only the donor can verify delivery' });
        }

        if (donation.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        donation.status = 'Delivered';
        donation.deliveredAt = new Date();
        donation.otp = null;
        await donation.save();

        // Update stats
        const co2Saved = (donation.weightInKg || 1) * 2.5;
        await User.findByIdAndUpdate(donation.donor, { $inc: { co2Saved: co2Saved } });
        await User.findByIdAndUpdate(donation.claimedBy, {
            $inc: { totalReceived: 1, co2Saved: co2Saved }
        });

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('donationDelivered', { donationId: donation._id });
        }

        res.json({ message: 'Delivery verified successfully!', donation, co2Saved });
    } catch (err) {
        console.error('Verify error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
