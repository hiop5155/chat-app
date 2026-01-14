import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_URL } from '../config';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Get email from state or default to empty
    const [email, setEmail] = useState(location.state?.email || '');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(0);

    // Countdown effect
    React.useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // Call verification API
            const res = await fetch(`${API_URL}/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
            });

            const data = await res.json();

            if (res.ok) {
                // Redirect to login on success
                alert('驗證成功！請登入');
                navigate('/login');
            } else {
                // Display error
                setError(data.error || '驗證失敗');
            }
        } catch (err) {
            setError('連線錯誤，請稍後再試');
        }
    };

    const handleResend = async () => {
        if (!email) {
            setError('請先輸入 Email');
            return;
        }
        if (countdown > 0) return;

        setError('');
        try {
            const res = await fetch(`${API_URL}/auth/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                setCountdown(60); // Start 60s cooldown
            } else {
                setError(data.error || '發送失敗');
            }
        } catch (err) {
            setError('連線錯誤，請稍後再試');
        }
    };

    return (
        // Use same container style as login page
        <div className="page-center">
            <div className="auth-container">
                <h2>帳號驗證</h2>
                <p style={{ marginBottom: '20px', color: '#666', fontSize: '0.9rem' }}>請至信箱收取驗證信，並輸入 6 位數代碼</p>

                {/* Use same form style as login page */}
                <form onSubmit={handleSubmit} className="auth-form">
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <input
                        type="text"
                        placeholder="請輸入驗證碼"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                        maxLength="6" // Limit to 6 characters
                    />

                    <button type="submit">驗證帳號</button>
                </form>

                <button
                    type="button"
                    onClick={handleResend}
                    disabled={countdown > 0}
                    style={{
                        marginTop: '10px',
                        background: 'transparent',
                        color: countdown > 0 ? '#999' : '#4a90e2',
                        border: 'none',
                        cursor: countdown > 0 ? 'default' : 'pointer',
                        textDecoration: countdown > 0 ? 'none' : 'underline',
                    }}
                >
                    {countdown > 0 ? `請等待 ${countdown} 秒後重試` : '沒收到驗證碼？重新發送'}
                </button>

                {/* Error message display area */}
                {error && <p className="error-msg">{error}</p>}
            </div>
        </div>
    );
};

export default VerifyEmail;
