import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ImpactDashboard() {
    const { API, user } = useAuth();
    const [global, setGlobal] = useState(null);
    const [userStats, setUserStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [globalRes, userRes] = await Promise.all([
                API.get('/impact'),
                API.get('/impact/user')
            ]);
            setGlobal(globalRes.data);
            setUserStats(userRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="loading-spinner"><div className="spinner"></div></div>
            </div>
        );
    }

    const maxMeals = global?.monthlyBreakdown?.length > 0
        ? Math.max(...global.monthlyBreakdown.map(m => m.meals), 1)
        : 1;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
        <div className="page">
            <div className="dashboard-header">
                <h1>🌍 Impact Dashboard</h1>
                <p>See how our community is making a difference</p>
            </div>

            {/* Your Impact */}
            {userStats && (
                <>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Your Impact
                        <span className="badge-display">🏅 {userStats.badge}</span>
                    </h2>
                    <div className="stats-grid">
                        <div className="stat-card green">
                            <div className="stat-icon">🍽️</div>
                            <div className="stat-value">{userStats.mealsSaved}</div>
                            <div className="stat-label">Meals Saved</div>
                        </div>
                        <div className="stat-card yellow">
                            <div className="stat-icon">🌿</div>
                            <div className="stat-value">{userStats.co2Saved.toFixed(1)}</div>
                            <div className="stat-label">kg CO₂ Prevented</div>
                        </div>
                        <div className="stat-card blue">
                            <div className="stat-icon">⚖️</div>
                            <div className="stat-value">{userStats.totalWeightKg.toFixed(1)}</div>
                            <div className="stat-label">kg Food Rescued</div>
                        </div>
                    </div>
                </>
            )}

            {/* Global Impact */}
            {global && (
                <>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', marginTop: '2rem' }}>
                        🌐 Community Impact
                    </h2>
                    <div className="stats-grid">
                        <div className="stat-card green">
                            <div className="stat-icon">🍽️</div>
                            <div className="stat-value">{global.mealsSaved}</div>
                            <div className="stat-label">Total Meals Saved</div>
                        </div>
                        <div className="stat-card yellow">
                            <div className="stat-icon">🌿</div>
                            <div className="stat-value">{global.co2Saved.toFixed(1)}</div>
                            <div className="stat-label">kg CO₂ Offset</div>
                        </div>
                        <div className="stat-card blue">
                            <div className="stat-icon">⚖️</div>
                            <div className="stat-value">{global.totalWeightKg.toFixed(1)}</div>
                            <div className="stat-label">kg Food Rescued</div>
                        </div>
                    </div>

                    {/* Monthly Bar Chart */}
                    {global.monthlyBreakdown && global.monthlyBreakdown.length > 0 && (
                        <div className="chart-container" style={{ marginTop: '2rem' }}>
                            <h3>📊 Monthly Meals Saved</h3>
                            <div className="bar-chart">
                                {global.monthlyBreakdown.map((m, i) => {
                                    const [year, month] = m.month.split('-');
                                    const pct = (m.meals / maxMeals) * 100;
                                    return (
                                        <div className="bar-col" key={i}>
                                            <span className="bar-value">{m.meals}</span>
                                            <div className="bar" style={{ height: `${Math.max(pct, 5)}%` }} title={`${m.meals} meals, ${m.co2Saved.toFixed(1)} kg CO₂`}></div>
                                            <span className="bar-label">{monthNames[parseInt(month) - 1]}<br />{year}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* CO2 explainer */}
                    <div className="card" style={{ marginTop: '2rem', padding: '1.5rem' }}>
                        <h3 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>💡 How We Calculate Impact</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                            For every <strong style={{ color: 'var(--primary-light)' }}>1 kg</strong> of food saved from going to waste,
                            approximately <strong style={{ color: 'var(--primary-light)' }}>2.5 kg</strong> of CO₂ emissions are prevented.
                            This accounts for the methane produced during food decomposition in landfills, as well as the
                            energy, water, and resources used in food production and transportation.
                        </p>
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--primary-light)' }}>
                            CO₂ Saved = Food Weight (kg) × 2.5
                        </div>
                    </div>
                </>
            )}

            {!global && !userStats && (
                <div className="empty-state">
                    <div className="empty-icon">📊</div>
                    <h3>No impact data yet</h3>
                    <p>Start donating or receiving food to see your impact!</p>
                </div>
            )}
        </div>
    );
}
