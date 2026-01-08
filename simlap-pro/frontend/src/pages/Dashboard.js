import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [usage, setUsage] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [userData, statsData, usageData, historyData] = await Promise.all([
        api.getMe(),
        api.getStats(),
        api.getUsage(),
        api.getAnalysisHistory(5)
      ]);

      setUser(userData);
      setStats(statsData);
      setUsage(usageData);
      setHistory(historyData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const returnUrl = window.location.origin + '/dashboard';
      const { url } = await api.createCheckoutSession(returnUrl);
      window.location.href = url;
    } catch (error) {
      alert('Failed to start checkout: ' + error.message);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const returnUrl = window.location.origin + '/dashboard';
      const { url } = await api.createPortalSession(returnUrl);
      window.location.href = url;
    } catch (error) {
      alert('Failed to open billing portal: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const isPro = user?.subscription_tier === 'pro';

  return (
    <div className="dashboard">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2>Dashboard</h2>
            <p style={{ color: '#999', marginTop: '0.5rem' }}>Welcome back, {user?.email}</p>
          </div>
          {!isPro && (
            <button className="btn btn-primary" onClick={handleUpgrade}>
              Upgrade to Pro
            </button>
          )}
          {isPro && (
            <button className="btn btn-secondary" onClick={handleManageSubscription}>
              Manage Subscription
            </button>
          )}
        </div>

        {/* Usage Stats */}
        <div className="analysis-card" style={{ marginBottom: '2rem' }}>
          <h3>Your Plan: {isPro ? '🌟 Pro' : '🆓 Free'}</h3>
          <p style={{ color: '#999', marginTop: '0.5rem' }}>
            {isPro
              ? 'Unlimited analyses per month'
              : `${usage?.current || 0} of ${usage?.limit || 3} analyses used this month`
            }
          </p>
          {!isPro && usage?.current >= usage?.limit && (
            <div className="error" style={{ marginTop: '1rem' }}>
              You've reached your monthly limit. Upgrade to Pro for unlimited analyses!
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>TOTAL ANALYSES</h3>
            <p>{stats?.totalAnalyses || 0}</p>
          </div>
          <div className="stat-card">
            <h3>BEST LAP TIME</h3>
            <p>
              {stats?.bestLap?.lap_time
                ? `${Math.floor(stats.bestLap.lap_time / 60)}:${(stats.bestLap.lap_time % 60).toFixed(2).padStart(5, '0')}`
                : '-'
              }
            </p>
          </div>
          <div className="stat-card">
            <h3>TRACKS ANALYZED</h3>
            <p>{stats?.recentTracks?.length || 0}</p>
          </div>
          <div className="stat-card">
            <h3>THIS MONTH</h3>
            <p>{usage?.current || 0}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '1rem', margin: '2rem 0' }}>
          <Link to="/upload" style={{ flex: 1 }}>
            <button className="btn btn-primary" style={{ width: '100%' }}>
              📊 Upload Telemetry
            </button>
          </Link>
        </div>

        {/* Recent Analyses */}
        <div className="analysis-card">
          <h3>Recent Analyses</h3>
          {history.length === 0 ? (
            <p style={{ color: '#999', marginTop: '1rem' }}>
              No analyses yet. Upload your first telemetry file to get started!
            </p>
          ) : (
            <div className="history-list" style={{ marginTop: '1.5rem' }}>
              {history.map((item) => (
                <div
                  key={item.id}
                  className="history-item"
                  onClick={() => navigate(`/analysis/${item.id}`)}
                >
                  <div>
                    <h4>{item.track_name} - {item.car_name}</h4>
                    <p style={{ color: '#999', fontSize: '0.875rem' }}>
                      {new Date(item.created_at).toLocaleDateString()} •
                      Lap: {Math.floor(item.lap_time / 60)}:{(item.lap_time % 60).toFixed(2).padStart(5, '0')}
                    </p>
                  </div>
                  <div style={{ color: '#667eea' }}>→</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Tracks */}
        {stats?.recentTracks && stats.recentTracks.length > 0 && (
          <div className="analysis-card" style={{ marginTop: '1.5rem' }}>
            <h3>Most Analyzed Tracks</h3>
            <div style={{ marginTop: '1rem' }}>
              {stats.recentTracks.map((track, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <span>{track.track_name}</span>
                  <span style={{ color: '#667eea' }}>{track.count} analyses</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
