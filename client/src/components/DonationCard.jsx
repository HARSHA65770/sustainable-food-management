import { useState, useEffect } from 'react';

const CATEGORY_CLASSES = {
    'Cooked Meal': 'badge-cooked',
    'Bakery': 'badge-bakery',
    'Groceries': 'badge-groceries',
    'Fruits & Vegetables': 'badge-fruits',
    'Beverages': 'badge-beverages',
    'Other': 'badge-other'
};

function getTimeLeft(expiryTime) {
    const diff = new Date(expiryTime) - new Date();
    if (diff <= 0) return { text: 'Expired', class: 'expiry-expired', hours: 0 };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 2) return { text: `${hours}h ${mins}m left`, class: 'expiry-fresh', hours };
    return { text: `${hours}h ${mins}m left`, class: 'expiry-soon', hours };
}

export default function DonationCard({ donation, onClaim, onVerify, showClaimBtn, showVerifyBtn }) {
    const [timeLeft, setTimeLeft] = useState(getTimeLeft(donation.expiryTime));

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(getTimeLeft(donation.expiryTime));
        }, 60000); // update every minute
        return () => clearInterval(timer);
    }, [donation.expiryTime]);

    const statusClass = `status-${donation.status.toLowerCase()}`;

    return (
        <div className="donation-card" id={`donation-${donation._id}`}>
            <div className="card-header">
                <span className="food-type">{donation.foodType}</span>
                <span className={`category-badge ${CATEGORY_CLASSES[donation.category] || 'badge-other'}`}>
                    {donation.category}
                </span>
            </div>

            {donation.description && (
                <p className="description">{donation.description}</p>
            )}

            <div className="card-details">
                <span>📦 {donation.quantity} {donation.unit}</span>
                <span className={`expiry-timer ${timeLeft.class}`}>⏰ {timeLeft.text}</span>
                {donation.address && <span>📍 {donation.address}</span>}
                <span>⚖️ ~{donation.weightInKg || 1} kg</span>
            </div>

            <div className="card-footer">
                <div>
                    {donation.donor && (
                        <span className="donor-info">
                            By <strong>{donation.donor.name || 'Anonymous'}</strong>
                            {donation.donor.rating && ` ⭐ ${donation.donor.rating}`}
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`status-badge ${statusClass}`}>{donation.status}</span>

                    {showClaimBtn && donation.status === 'Available' && timeLeft.hours >= 0 && timeLeft.text !== 'Expired' && (
                        <button className="btn btn-primary btn-sm" onClick={() => onClaim(donation._id)} id={`claim-${donation._id}`}>
                            Claim
                        </button>
                    )}

                    {showVerifyBtn && donation.status === 'Claimed' && (
                        <button className="btn btn-warning btn-sm" onClick={() => onVerify(donation)} id={`verify-${donation._id}`}>
                            Verify OTP
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
