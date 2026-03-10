require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Import routes
const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donations');
const impactRoutes = require('./routes/impact');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST', 'PATCH', 'DELETE']
    }
});

// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // Join user-specific room for targeted notifications
    socket.on('joinRoom', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`👤 User ${userId} joined their room`);
    });

    // Update location for proximity notifications
    socket.on('updateLocation', (data) => {
        socket.userData = { ...socket.userData, ...data };
    });

    socket.on('disconnect', () => {
        console.log(`❌ User disconnected: ${socket.id}`);
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/impact', impactRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected successfully');
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });

module.exports = { app, server, io };
