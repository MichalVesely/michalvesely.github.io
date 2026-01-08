import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

function Analysis() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalysis();
  }, [id]);

  const loadAnalysis = async () => {
    try {
      const result = await api.getAnalysis(id);
      setData(result);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
        <Link to="/dashboard">
          <button className="btn btn-secondary">Back to Dashboard</button>
        </Link>
      </div>
    );
  }

  const { telemetryData, analysis } = data;
  const lapTimeMinutes = Math.floor(telemetryData.lapTime / 60);
  const lapTimeSeconds = (telemetryData.lapTime % 60).toFixed(3);

  return (
    <div className="container">
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2>{telemetryData.trackName} - {telemetryData.carName}</h2>
            <p style={{ color: '#999', marginTop: '0.5rem' }}>
              {new Date(data.createdAt).toLocaleString()}
            </p>
          </div>
          <Link to="/dashboard">
            <button className="btn btn-secondary">Back</button>
          </Link>
        </div>

        {/* Lap Summary */}
        <div className="analysis-card">
          <h3>Lap Summary</h3>
          <div className="stats-grid" style={{ marginTop: '1.5rem' }}>
            <div className="stat-card">
              <h3>LAP TIME</h3>
              <p>{lapTimeMinutes}:{lapTimeSeconds.padStart(6, '0')}</p>
            </div>
            <div className="stat-card">
              <h3>MAX SPEED</h3>
              <p>{telemetryData.maxSpeed.toFixed(0)} km/h</p>
            </div>
            <div className="stat-card">
              <h3>AVG SPEED</h3>
              <p>{telemetryData.avgSpeed.toFixed(0)} km/h</p>
            </div>
            <div className="stat-card">
              <h3>CORNERS</h3>
              <p>{telemetryData.corners.length}</p>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="analysis-card">
          <h3>AI Analysis</h3>
          <div className="insights">{analysis.insights}</div>

          {analysis.estimatedImprovement && (
            <div style={{
              background: 'rgba(102, 126, 234, 0.2)',
              padding: '1rem',
              borderRadius: '8px',
              marginTop: '1rem',
              border: '1px solid #667eea'
            }}>
              <strong>Potential Improvement:</strong> -{analysis.estimatedImprovement.toFixed(2)}s per lap
            </div>
          )}
        </div>

        {/* Recommendations */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <div className="analysis-card">
            <h3>Recommendations</h3>
            <div className="recommendations">
              {analysis.recommendations.map((rec, index) => (
                <div key={index} className={`recommendation ${rec.priority}`}>
                  <h4>
                    {rec.priority === 'high' && '🔴 '}
                    {rec.priority === 'medium' && '🟡 '}
                    {rec.priority === 'low' && '🟢 '}
                    {rec.title}
                  </h4>
                  <p style={{ color: '#ccc' }}>{rec.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Telemetry Details */}
        <div className="analysis-card">
          <h3>Telemetry Details</h3>
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <p style={{ color: '#999' }}>Sim Type</p>
                <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>{telemetryData.simType}</p>
              </div>
              <div>
                <p style={{ color: '#999' }}>Data Points</p>
                <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>{telemetryData.totalRecords}</p>
              </div>
              <div>
                <p style={{ color: '#999' }}>Max Throttle</p>
                <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
                  {(telemetryData.maxThrottle * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <p style={{ color: '#999' }}>Max Brake</p>
                <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
                  {(telemetryData.maxBrake * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <p style={{ color: '#999' }}>Braking Points</p>
                <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>{telemetryData.brakingPoints.length}</p>
              </div>
              <div>
                <p style={{ color: '#999' }}>Acceleration Zones</p>
                <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>{telemetryData.accelerationPoints.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Speed Graph Preview */}
        {telemetryData.dataPoints && telemetryData.dataPoints.length > 0 && (
          <div className="analysis-card">
            <h3>Speed Trace</h3>
            <div style={{
              marginTop: '1.5rem',
              height: '200px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <svg width="100%" height="100%" style={{ display: 'block' }}>
                <polyline
                  points={telemetryData.dataPoints
                    .slice(0, 500)
                    .map((point, index) => {
                      const x = (index / 500) * 100;
                      const y = 100 - (point.speed / telemetryData.maxSpeed) * 80;
                      return `${x}%,${y}%`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#667eea"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <p style={{ color: '#999', marginTop: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>
              Speed variation throughout the lap
            </p>
          </div>
        )}

        {/* Next Steps */}
        <div style={{
          background: 'rgba(102, 126, 234, 0.1)',
          padding: '2rem',
          borderRadius: '12px',
          textAlign: 'center',
          marginTop: '2rem'
        }}>
          <h3>Ready to improve?</h3>
          <p style={{ color: '#999', margin: '1rem 0' }}>
            Upload more laps to track your progress and see your improvement over time
          </p>
          <Link to="/upload">
            <button className="btn btn-primary">Upload Another Lap</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Analysis;
