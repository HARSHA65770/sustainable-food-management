import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const notifId = useRef(0);

    useEffect(() => {
        if (!token) return;

        const s = io('/', {
            transports: ['websocket', 'polling']
        });

        s.on('connect', () => {
            console.log('Socket connected:', s.id);
            if (user) {
                s.emit('joinRoom', user.id || user._id);
            }
        });

        s.on('newDonation', (donation) => {
            addNotification(`🍽️ New donation: ${donation.foodType}`, 'info');
        });

        s.on('nearbyDonation', (data) => {
            addNotification(`📍 ${data.message}`, 'nearby');
        });

        s.on('donationClaimed', (data) => {
            if (data.message) {
                addNotification(`✅ ${data.message}`, 'success');
            }
        });

        s.on('donationDelivered', () => {
            addNotification('🎉 A donation was successfully delivered!', 'success');
        });

        setSocket(s);

        return () => {
            s.disconnect();
        };
    }, [token, user]);

    const addNotification = (message, type = 'info') => {
        const id = ++notifId.current;
        setNotifications(prev => [...prev, { id, message, type }]);
        // Auto-remove after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <SocketContext.Provider value={{ socket, notifications, addNotification, removeNotification }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    const ctx = useContext(SocketContext);
    if (!ctx) throw new Error('useSocket must be used within SocketProvider');
    return ctx;
}
