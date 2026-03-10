import { useState, useRef } from 'react';

export default function OtpModal({ mode, otp, onVerify, onClose }) {
    // mode: 'display' (receiver sees OTP) or 'input' (donor enters OTP)
    const [otpInput, setOtpInput] = useState(['', '', '', '']);
    const [error, setError] = useState('');
    const inputRefs = useRef([]);

    const handleChange = (index, value) => {
        if (value.length > 1) value = value[value.length - 1];
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otpInput];
        newOtp[index] = value;
        setOtpInput(newOtp);
        setError('');

        // Auto-focus next
        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpInput[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleSubmit = () => {
        const code = otpInput.join('');
        if (code.length !== 4) {
            setError('Please enter all 4 digits');
            return;
        }
        onVerify(code);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                {mode === 'display' ? (
                    <>
                        <h2>🔐 Your Verification Code</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Show this code to the donor when you pick up the food. They will enter it to confirm the handoff.
                        </p>
                        <div className="otp-display">
                            {otp.split('').map((digit, i) => (
                                <div className="otp-digit" key={i}>{digit}</div>
                            ))}
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-primary" onClick={onClose}>Got it!</button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2>🔑 Enter Verification Code</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Ask the receiver for their 4-digit code and enter it below to confirm the pickup.
                        </p>
                        {error && <div className="error-message">{error}</div>}
                        <div className="otp-input-group">
                            {otpInput.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => inputRefs.current[i] = el}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleChange(i, e.target.value)}
                                    onKeyDown={e => handleKeyDown(i, e)}
                                    id={`otp-input-${i}`}
                                />
                            ))}
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSubmit} id="verify-otp-btn">Verify</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
