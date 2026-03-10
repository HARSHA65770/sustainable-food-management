import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (!user) return null;

    return (
        <nav className="navbar" id="main-navbar">
            <NavLink to="/" className="navbar-brand">
                🌱 Food<span>Bridge</span>
            </NavLink>

            <div className="navbar-links">
                <span className={`nav-role ${user.role.toLowerCase()}`}>
                    {user.role}
                </span>

                {user.role === 'Donor' && (
                    <NavLink to="/donor" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Dashboard
                    </NavLink>
                )}

                {user.role === 'Receiver' && (
                    <NavLink to="/receiver" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Find Food
                    </NavLink>
                )}

                <NavLink to="/impact" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    Impact
                </NavLink>

                <button className="nav-link nav-logout" onClick={handleLogout} id="logout-btn">
                    Logout
                </button>
            </div>
        </nav>
    );
}
