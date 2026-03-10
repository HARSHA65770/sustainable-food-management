import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import MapView from '../components/MapView';
import DonationCard from '../components/DonationCard';
import OtpModal from '../components/OtpModal';
import SafeHandlingPopup from '../components/SafeHandlingPopup';

export default function ReceiverDashboard() {
    const { user, API } = useAuth();
    const [donations, setDonations] = useState([]);
    const [userPosition, setUserPosition] = useState(null);
    const [radius, setRadius] = useState(5000); // meters
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('map');

    // OTP state
    const [claimedOtp, setClaimedOtp] = useState(null);

    // Safe handling popup
    const [showSafeHandling, setShowSafeHandling] = useState(false);
    const [pendingClaimId, setPendingClaimId] = useState(null);
    const [hasAcceptedGuidelines, setHasAcceptedGuidelines] = useState(
        sessionStorage.getItem('safeHandlingAccepted') === 'true'
    );

    // Claimed donations
    const [claimedDonations, setClaimedDonations] = useState([]);

    useEffect(() => {
        fetchLocation();
    }, []);

    useEffect(() => {
        if (userPosition) fetchNearby();
    }, [userPosition, radius]);

    const fetchLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserPosition([pos.coords.latitude, pos.coords.longitude]);
                },
                () => {
                    // Default position if denied
                    setUserPosition([20.5937, 78.9629]);
                }
            );
        } else {
            setUserPosition([20.5937, 78.9629]);
        }
    };

    const fetchNearby = useCallback(async () => {
        if (!userPosition) return;
        setLoading(true);
        try {
            const [lng, lat] = [userPosition[1], userPosition[0]];
            const res = await API.get(`/donations/nearby?lng=${lng}&lat=${lat}&radius=${radius}`);
            setDonations(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [userPosition, radius]);

    const fetchClaimed = async () => {
        try {
            const res = await API.get('/donations/claimed');
            setClaimedDonations(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (activeTab === 'claimed') fetchClaimed();
    }, [activeTab]);

    const handleClaim = async (donationId) => {
        if (!hasAcceptedGuidelines) {
            setPendingClaimId(donationId);
            setShowSafeHandling(true);
            return;
        }
        await performClaim(donationId);
    };

    const performClaim = async (donationId) => {
        setError('');
        try {
            const res = await API.patch(`/donations/${donationId}/claim`);
            setClaimedOtp(res.data.otp);
            setSuccess('Food claimed successfully! Show the OTP to the donor.');
            fetchNearby();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to claim');
            setTimeout(() => setError(''), 5000);
        }
    };

    const handleAcceptGuidelines = () => {
        setHasAcceptedGuidelines(true);
        sessionStorage.setItem('safeHandlingAccepted', 'true');
        setShowSafeHandling(false);
        if (pendingClaimId) {
            performClaim(pendingClaimId);
            setPendingClaimId(null);
        }
    };

    return (
        <div className="page">
            <div className="dashboard-header">
                <h1>📍 Find Food Near You</h1>
                <p>Discover available food donations within your area</p>
            </div>

            {success && <div className="success-message">{success}</div>}
            {error && <div className="error-message">{error}</div>}

            {/* Tabs */}
            <div className="tabs">
                <button className={`tab ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')} id="tab-map">
                    🗺️ Map View
                </button>
                <button className={`tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')} id="tab-list">
                    📋 List View
                </button>
                <button className={`tab ${activeTab === 'claimed' ? 'active' : ''}`} onClick={() => setActiveTab('claimed')} id="tab-claimed">
                    ✅ My Claims
                </button>
            </div>

            {/* Map Controls */}
            {(activeTab === 'map' || activeTab === 'list') && (
                <div className="map-controls">
                    <div className="radius-slider">
                        <span>Search radius:</span>
                        <input
                            type="range"
                            min="1000"
                            max="20000"
                            step="500"
                            value={radius}
                            onChange={e => setRadius(parseInt(e.target.value))}
                            id="radius-slider"
                        />
                        <span style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{(radius / 1000).toFixed(1)} km</span>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={fetchNearby} id="refresh-btn">
                        🔄 Refresh
                    </button>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {donations.length} donation{donations.length !== 1 ? 's' : ''} found
                    </span>
                </div>
            )}

            {/* Map Tab */}
            {activeTab === 'map' && (
                <>
                    <MapView
                        donations={donations}
                        userPosition={userPosition}
                        onDonationClick={handleClaim}
                    />
                    {/* Also show a list below the map */}
                    <h3 style={{ marginTop: '1rem', marginBottom: '0.75rem', fontWeight: 700 }}>Nearby Donations</h3>
                    {loading ? (
                        <div className="loading-spinner"><div className="spinner"></div></div>
                    ) : donations.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🔍</div>
                            <h3>No donations nearby</h3>
                            <p>Try increasing the search radius or check back later</p>
                        </div>
                    ) : (
                        <div className="donations-list">
                            {donations.map(d => (
                                <DonationCard key={d._id} donation={d} showClaimBtn={true} onClaim={handleClaim} />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* List Tab */}
            {activeTab === 'list' && (
                loading ? (
                    <div className="loading-spinner"><div className="spinner"></div></div>
                ) : donations.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🔍</div>
                        <h3>No donations nearby</h3>
                        <p>Try increasing the search radius or check back later</p>
                    </div>
                ) : (
                    <div className="donations-list">
                        {donations.map(d => (
                            <DonationCard key={d._id} donation={d} showClaimBtn={true} onClaim={handleClaim} />
                        ))}
                    </div>
                )
            )}

            {/* Claimed Tab */}
            {activeTab === 'claimed' && (
                claimedDonations.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📦</div>
                        <h3>No claimed donations yet</h3>
                        <p>Find and claim food from the Map or List view</p>
                    </div>
                ) : (
                    <div className="donations-list">
                        {claimedDonations.map(d => (
                            <DonationCard key={d._id} donation={d} />
                        ))}
                    </div>
                )
            )}

            {/* OTP Display Modal */}
            {claimedOtp && (
                <OtpModal mode="display" otp={claimedOtp} onClose={() => setClaimedOtp(null)} />
            )}

            {/* Safe Handling Popup */}
            {showSafeHandling && (
                <SafeHandlingPopup
                    onAccept={handleAcceptGuidelines}
                    onClose={() => { setShowSafeHandling(false); setPendingClaimId(null); }}
                />
            )}
        </div>
    );
}
