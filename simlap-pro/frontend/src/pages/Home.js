import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="container">
      <div className="hero">
        <h2>AI-Powered Telemetry Analysis for Sim Racers</h2>
        <p>Get faster with personalized coaching insights from your telemetry data</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          <Link to="/register">
            <button className="btn btn-primary">Start Free Trial</button>
          </Link>
          <Link to="/pricing">
            <button className="btn btn-secondary">View Pricing</button>
          </Link>
        </div>
      </div>

      <div className="features">
        <div className="feature-card">
          <div style={{ fontSize: '3rem' }}>📊</div>
          <h3>Deep Analysis</h3>
          <p>Upload telemetry from any sim and get detailed insights on every aspect of your lap.</p>
        </div>

        <div className="feature-card">
          <div style={{ fontSize: '3rem' }}>🤖</div>
          <h3>AI Coaching</h3>
          <p>Our AI analyzes your data and provides personalized recommendations to improve your lap times.</p>
        </div>

        <div className="feature-card">
          <div style={{ fontSize: '3rem' }}>📈</div>
          <h3>Track Progress</h3>
          <p>Monitor your improvement over time with detailed statistics and lap comparisons.</p>
        </div>

        <div className="feature-card">
          <div style={{ fontSize: '3rem' }}>⚡</div>
          <h3>Multi-Sim Support</h3>
          <p>Works with iRacing, ACC, rFactor2, and more. Upload CSV or standard telemetry formats.</p>
        </div>

        <div className="feature-card">
          <div style={{ fontSize: '3rem' }}>💰</div>
          <h3>Affordable</h3>
          <p>At just $9.99/month, get unlimited analyses - 50% cheaper than competitors.</p>
        </div>

        <div className="feature-card">
          <div style={{ fontSize: '3rem' }}>🚀</div>
          <h3>Instant Results</h3>
          <p>Get your analysis in seconds. No waiting, no complex setup required.</p>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2 style={{ marginBottom: '2rem' }}>How It Works</h2>
        <div className="features">
          <div className="feature-card">
            <h3>1. Upload Your Data</h3>
            <p>Export telemetry from your sim racing game and upload it to SimLap Pro.</p>
          </div>
          <div className="feature-card">
            <h3>2. AI Analyzes Your Lap</h3>
            <p>Our AI examines your speed, braking, throttle, and cornering data.</p>
          </div>
          <div className="feature-card">
            <h3>3. Get Faster</h3>
            <p>Follow the personalized recommendations to shave seconds off your lap times.</p>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '4rem', padding: '3rem', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '12px' }}>
        <h2 style={{ marginBottom: '1rem' }}>Ready to Get Faster?</h2>
        <p style={{ marginBottom: '2rem', color: '#999' }}>
          Join hundreds of sim racers improving their lap times with AI-powered analysis
        </p>
        <Link to="/register">
          <button className="btn btn-primary">Start Free - 3 Analyses/Month</button>
        </Link>
      </div>
    </div>
  );
}

export default Home;
