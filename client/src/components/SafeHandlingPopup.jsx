import { useState } from 'react';

export default function SafeHandlingPopup({ onAccept, onClose }) {
    const [agreed, setAgreed] = useState(false);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
                <h2>⚠️ Safe Food Handling Guidelines</h2>
                <div className="safe-handling-content">
                    <h3>Before Claiming Food</h3>
                    <ul>
                        <li>Check the expiry time and ensure you can pick up the food before it expires</li>
                        <li>Bring appropriate containers or bags for transportation</li>
                        <li>Plan your route to minimize travel time</li>
                    </ul>

                    <h3>During Pickup</h3>
                    <ul>
                        <li>Inspect the food visually before accepting</li>
                        <li>Check for proper packaging and temperature</li>
                        <li>Verify the food matches the description provided</li>
                        <li>Use the OTP verification to confirm the handoff</li>
                    </ul>

                    <h3>Food Safety Notice</h3>
                    <ul>
                        <li>Consume perishable foods within 2 hours of pickup</li>
                        <li>Refrigerate items promptly if not consuming immediately</li>
                        <li>When in doubt about food safety, do not consume</li>
                        <li>FoodBridge does not guarantee the quality or safety of donated food</li>
                    </ul>

                    <h3>Disclaimer</h3>
                    <p>
                        By claiming food through FoodBridge, you acknowledge that you are voluntarily
                        accepting donated food items. FoodBridge serves as a connection platform and
                        is not liable for the quality, safety, or condition of any food items exchanged
                        through this service. Please use your own judgment when assessing food safety.
                    </p>
                </div>

                <label className="checkbox-label" id="agree-checkbox-label">
                    <input
                        type="checkbox"
                        checked={agreed}
                        onChange={e => setAgreed(e.target.checked)}
                        id="agree-checkbox"
                    />
                    I have read and agree to the Safe Food Handling Guidelines
                </label>

                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button
                        className="btn btn-primary"
                        onClick={onAccept}
                        disabled={!agreed}
                        id="accept-guidelines-btn"
                    >
                        Accept & Continue
                    </button>
                </div>
            </div>
        </div>
    );
}
