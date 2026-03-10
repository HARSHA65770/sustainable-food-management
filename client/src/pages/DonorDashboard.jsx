import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DonationCard from '../components/DonationCard';
import OtpModal from '../components/OtpModal';

export default function DonorDashboard() {
    const { user, API } = useAuth();
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [verifyDonation, setVerifyDonation] = useState(null);
    const [verifyError, setVerifyError] = useState('');

    const [form, setForm] = useState({
        foodType: '',
        category: 'Cooked Meal',
        quantity: '',
        unit: 'servings',
        description: '',
        expiryTime: '',
        address: '',
        weightInKg: '1',
        lat: '',
        lng: ''
    });

    useEffect(() => {
        fetchDonations();
        fetchLocation();
    }, []);

    const fetchDonations = async () => {
        try {
            const res = await API.get('/donations/my');
            setDonations(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setForm(prev => ({
                        ...prev,
                        lat: pos.coords.latitude.toFixed(6),
                        lng: pos.coords.longitude.toFixed(6)
                    }));
                },
                () => {
                    console.log('Location permission denied — user can enter manually');
                }
            );
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const payload = {
                foodType: form.foodType,
                category: form.category,
                quantity: parseFloat(form.quantity),
                unit: form.unit,
                description: form.description,
                expiryTime: form.expiryTime,
                address: form.address,
                weightInKg: parseFloat(form.weightInKg) || 1,
                location: {
                    type: 'Point',
                    coordinates: [parseFloat(form.lng), parseFloat(form.lat)]
                }
            };

            await API.post('/donations', payload);
            setSuccess('Donation posted successfully! 🎉');
            setForm({ foodType: '', category: 'Cooked Meal', quantity: '', unit: 'servings', description: '', expiryTime: '', address: '', weightInKg: '1', lat: form.lat, lng: form.lng });
            setShowForm(false);
            fetchDonations();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post donation');
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerify = async (otp) => {
        try {
            await API.patch(`/donations/${verifyDonation._id}/verify`, { otp });
            setVerifyDonation(null);
            setVerifyError('');
            setSuccess('Delivery verified! Thank you for your contribution! 🎉');
            fetchDonations();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setVerifyError(err.response?.data?.message || 'Invalid OTP');
        }
    };

    // Get default expiry time (2 hours from now)
    const getDefaultExpiry = () => {
        const d = new Date();
        d.setHours(d.getHours() + 2);
        return d.toISOString().slice(0, 16);
    };

    const activeCount = donations.filter(d => d.status === 'Available').length;
    const claimedCount = donations.filter(d => d.status === 'Claimed').length;
    const deliveredCount = donations.filter(d => d.status === 'Delivered').length;

    return (
        <div className="page">
            <div className="dashboard-header">
                <h1>👋 Hello, {user?.name}</h1>
                <p>Share your surplus food with people nearby</p>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card green">
                    <div className="stat-icon">🍽️</div>
                    <div className="stat-value">{activeCount}</div>
                    <div className="stat-label">Active Posts</div>
                </div>
                <div className="stat-card yellow">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-value">{claimedCount}</div>
                    <div className="stat-label">Pending Pickup</div>
                </div>
                <div className="stat-card blue">
                    <div className="stat-icon">✅</div>
                    <div className="stat-value">{deliveredCount}</div>
                    <div className="stat-label">Delivered</div>
                </div>
            </div>

            {success && <div className="success-message">{success}</div>}
            {error && !showForm && <div className="error-message">{error}</div>}

            {/* Toggle form button */}
            <button
                className="btn btn-primary btn-lg"
                onClick={() => { setShowForm(!showForm); if (!form.expiryTime) setForm(prev => ({ ...prev, expiryTime: getDefaultExpiry() })); }}
                style={{ marginBottom: '1.5rem' }}
                id="toggle-form-btn"
            >
                {showForm ? '✕ Cancel' : '+ Post New Donation'}
            </button>

            {/* Donation Form */}
            {showForm && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ marginBottom: '1.25rem', fontSize: '1.3rem', fontWeight: 700 }}>📋 New Donation</h2>
                    {error && <div className="error-message">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label htmlFor="foodType">Food Name</label>
                                <input className="form-input" id="foodType" name="foodType" placeholder="e.g. Rice & Curry" value={form.foodType} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="category">Category</label>
                                <select className="form-select" id="category" name="category" value={form.category} onChange={handleChange}>
                                    <option>Cooked Meal</option>
                                    <option>Bakery</option>
                                    <option>Groceries</option>
                                    <option>Fruits & Vegetables</option>
                                    <option>Beverages</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="quantity">Quantity</label>
                                <input className="form-input" id="quantity" name="quantity" type="number" step="0.1" min="0.1" placeholder="e.g. 5" value={form.quantity} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="unit">Unit</label>
                                <select className="form-select" id="unit" name="unit" value={form.unit} onChange={handleChange}>
                                    <option value="servings">Servings</option>
                                    <option value="kg">Kilograms</option>
                                    <option value="items">Items</option>
                                    <option value="liters">Liters</option>
                                    <option value="packets">Packets</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="weightInKg">Estimated Weight (kg)</label>
                                <input className="form-input" id="weightInKg" name="weightInKg" type="number" step="0.1" min="0.1" placeholder="1" value={form.weightInKg} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="expiryTime">Expires At</label>
                                <input className="form-input" id="expiryTime" name="expiryTime" type="datetime-local" value={form.expiryTime} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="description">Description (optional)</label>
                            <textarea className="form-textarea" id="description" name="description" placeholder="Any special instructions or details..." value={form.description} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="address">Pickup Address</label>
                            <input className="form-input" id="address" name="address" placeholder="Building name, street..." value={form.address} onChange={handleChange} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label htmlFor="lat">Latitude</label>
                                <input className="form-input" id="lat" name="lat" type="number" step="any" placeholder="Auto-detected" value={form.lat} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="lng">Longitude</label>
                                <input className="form-input" id="lng" name="lng" type="number" step="any" placeholder="Auto-detected" value={form.lng} onChange={handleChange} required />
                            </div>
                        </div>
                        <button className="btn btn-primary btn-block" type="submit" disabled={submitting} id="submit-donation">
                            {submitting ? 'Posting...' : '🚀 Post Donation'}
                        </button>
                    </form>
                </div>
            )}

            {/* My Donations List */}
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem' }}>My Donations</h2>
            {loading ? (
                <div className="loading-spinner"><div className="spinner"></div></div>
            ) : donations.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🍽️</div>
                    <h3>No donations yet</h3>
                    <p>Click "Post New Donation" to share your first meal!</p>
                </div>
            ) : (
                <div className="donations-list">
                    {donations.map(d => (
                        <DonationCard
                            key={d._id}
                            donation={d}
                            showVerifyBtn={true}
                            onVerify={(donation) => setVerifyDonation(donation)}
                        />
                    ))}
                </div>
            )}

            {/* OTP Verify Modal */}
            {verifyDonation && (
                <OtpModal
                    mode="input"
                    onVerify={handleVerify}
                    onClose={() => { setVerifyDonation(null); setVerifyError(''); }}
                />
            )}
        </div>
    );
}
