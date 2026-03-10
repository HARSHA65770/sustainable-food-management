const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
    donor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    foodType: {
        type: String,
        required: [true, 'Food type is required'],
        trim: true
    },
    category: {
        type: String,
        enum: ['Cooked Meal', 'Bakery', 'Groceries', 'Fruits & Vegetables', 'Beverages', 'Other'],
        required: [true, 'Category is required']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: 0.1
    },
    unit: {
        type: String,
        enum: ['kg', 'items', 'servings', 'liters', 'packets'],
        default: 'servings'
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    expiryTime: {
        type: Date,
        required: [true, 'Expiry time is required']
    },
    status: {
        type: String,
        enum: ['Available', 'Claimed', 'Delivered', 'Expired'],
        default: 'Available'
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    address: {
        type: String,
        trim: true
    },
    claimedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    otp: {
        type: String,
        default: null
    },
    claimedAt: {
        type: Date,
        default: null
    },
    deliveredAt: {
        type: Date,
        default: null
    },
    weightInKg: {
        type: Number,
        default: 1 // estimated weight for CO2 calculation
    }
}, { timestamps: true });

donationSchema.index({ location: '2dsphere' });
donationSchema.index({ status: 1, expiryTime: 1 });
donationSchema.index({ donor: 1 });

// Virtual: check if expired
donationSchema.virtual('isExpired').get(function () {
    return this.expiryTime < new Date() && this.status === 'Available';
});

// Pre-find middleware to auto-expire donations
donationSchema.pre(/^find/, function (next) {
    // This doesn't modify docs but queries can filter
    next();
});

module.exports = mongoose.model('Donation', donationSchema);
