import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function Pricing() {
  const navigate = useNavigate();
  const isAuthenticated = api.isAuthenticated();
  const user = api.getCurrentUser();

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }

    try {
      const returnUrl = window.location.origin + '/dashboard';
      const { url } = await api.createCheckoutSession(returnUrl);
      window.location.href = url;
    } catch (error) {
      alert('Failed to start checkout: ' + error.message);
    }
  };

  return (
    <div className="container">
      <div className="hero">
        <h2>Simple, Transparent Pricing</h2>
        <p>Choose the plan that's right for you</p>
      </div>

      <div className="pricing-grid">
        <div className="pricing-card">
          <h3>Free</h3>
          <div className="price">$0<span style={{ fontSize: '1rem', color: '#999' }}>/month</span></div>
          <ul>
            <li>✅ 3 analyses per month</li>
            <li>✅ AI-powered insights</li>
            <li>✅ Telemetry visualization</li>
            <li>✅ Performance recommendations</li>
            <li>✅ Track progress history</li>
            <li>✅ Multi-sim support</li>
          </ul>
          {!isAuthenticated && (
            <Link to="/register">
              <button className="btn btn-secondary" style={{ width: '100%' }}>
                Get Started
              </button>
            </Link>
          )}
          {isAuthenticated && user?.subscription_tier === 'free' && (
            <button className="btn btn-secondary" disabled style={{ width: '100%' }}>
              Current Plan
            </button>
          )}
        </div>

        <div className="pricing-card featured">
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            margin: '-2rem -2rem 1rem -2rem',
            padding: '0.5rem',
            textAlign: 'center',
            fontWeight: 'bold',
            borderRadius: '12px 12px 0 0'
          }}>
            🌟 MOST POPULAR
          </div>
          <h3>Pro</h3>
          <div className="price">$9.99<span style={{ fontSize: '1rem', color: '#999' }}>/month</span></div>
          <p style={{ color: '#999', marginTop: '-0.5rem' }}>
            50% cheaper than competitors
          </p>
          <ul>
            <li>✅ <strong>Unlimited analyses</strong></li>
            <li>✅ AI-powered insights</li>
            <li>✅ Telemetry visualization</li>
            <li>✅ Performance recommendations</li>
            <li>✅ Track progress history</li>
            <li>✅ Multi-sim support</li>
            <li>✅ Priority support</li>
            <li>✅ Advanced analytics (coming soon)</li>
            <li>✅ Lap comparisons (coming soon)</li>
          </ul>
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={handleUpgrade}
            disabled={user?.subscription_tier === 'pro'}
          >
            {user?.subscription_tier === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
          </button>
        </div>
      </div>

      <div style={{ marginTop: '4rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '2rem' }}>Why Choose SimLap Pro?</h2>
        <div className="features">
          <div className="feature-card">
            <div style={{ fontSize: '2.5rem' }}>💰</div>
            <h3>Best Value</h3>
            <p>50% cheaper than competitors like Sim Racing Telemetry ($20/mo) while offering the same features</p>
          </div>
          <div className="feature-card">
            <div style={{ fontSize: '2.5rem' }}>🤖</div>
            <h3>AI-Powered</h3>
            <p>Get personalized coaching insights that would cost $50-100/hour from a human coach</p>
          </div>
          <div className="feature-card">
            <div style={{ fontSize: '2.5rem' }}>⚡</div>
            <h3>Instant Results</h3>
            <p>Upload your telemetry and get detailed analysis in seconds, not hours</p>
          </div>
        </div>
      </div>

      <div style={{
        background: 'rgba(102, 126, 234, 0.1)',
        padding: '3rem',
        borderRadius: '12px',
        marginTop: '4rem',
        textAlign: 'center'
      }}>
        <h2>Frequently Asked Questions</h2>
        <div style={{
          marginTop: '2rem',
          display: 'grid',
          gap: '1.5rem',
          textAlign: 'left',
          maxWidth: '800px',
          margin: '2rem auto 0'
        }}>
          <div>
            <h3>What sims are supported?</h3>
            <p style={{ color: '#999', marginTop: '0.5rem' }}>
              We support iRacing, Assetto Corsa Competizione, Assetto Corsa, rFactor 2, F1 series, Automobilista 2,
              and any sim that can export CSV telemetry data.
            </p>
          </div>
          <div>
            <h3>Can I cancel anytime?</h3>
            <p style={{ color: '#999', marginTop: '0.5rem' }}>
              Yes! You can cancel your subscription at any time. No long-term contracts or commitments.
            </p>
          </div>
          <div>
            <h3>How does the AI analysis work?</h3>
            <p style={{ color: '#999', marginTop: '0.5rem' }}>
              Our AI analyzes your speed, braking, throttle, and cornering data to identify areas where you're losing
              time. It then provides specific, actionable recommendations to improve your lap times.
            </p>
          </div>
          <div>
            <h3>Do I need to know how to code?</h3>
            <p style={{ color: '#999', marginTop: '0.5rem' }}>
              Not at all! Just export your telemetry data from your sim (usually a CSV file) and upload it.
              We handle all the complex analysis automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pricing;
