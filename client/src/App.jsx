import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import NotificationToast from './components/NotificationToast';
import LoginPage from './pages/LoginPage';
import DonorDashboard from './pages/DonorDashboard';
import ReceiverDashboard from './pages/ReceiverDashboard';
import ImpactDashboard from './pages/ImpactDashboard';

function ProtectedRoute({ children, allowedRole }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!user) return <Navigate to="/" replace />;
    if (allowedRole && user.role !== allowedRole) {
        return <Navigate to={user.role === 'Donor' ? '/donor' : '/receiver'} replace />;
    }
    return children;
}

function AppRoutes() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <NotificationToast />
            <Routes>
                <Route path="/" element={
                    user
                        ? <Navigate to={user.role === 'Donor' ? '/donor' : '/receiver'} replace />
                        : <LoginPage />
                } />
                <Route path="/donor" element={
                    <ProtectedRoute allowedRole="Donor"><DonorDashboard /></ProtectedRoute>
                } />
                <Route path="/receiver" element={
                    <ProtectedRoute allowedRole="Receiver"><ReceiverDashboard /></ProtectedRoute>
                } />
                <Route path="/impact" element={
                    <ProtectedRoute><ImpactDashboard /></ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}

export default function App() {
    return (
        <Router>
            <AuthProvider>
                <SocketProvider>
                    <div className="app-container">
                        <AppRoutes />
                    </div>
                </SocketProvider>
            </AuthProvider>
        </Router>
    );
}
