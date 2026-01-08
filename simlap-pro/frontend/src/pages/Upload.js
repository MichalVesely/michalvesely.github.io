import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [simType, setSimType] = useState('iRacing');
  const [trackName, setTrackName] = useState('');
  const [carName, setCarName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await api.uploadTelemetry(file, simType, trackName, carName);
      navigate(`/analysis/${result.id}`);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Upload failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoUpload = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await api.createDemoAnalysis(trackName || 'Spa-Francorchamps', carName || 'GT3');
      navigate(`/analysis/${result.id}`);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Demo creation failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2>Upload Telemetry</h2>
        <p style={{ color: '#999', marginTop: '0.5rem', marginBottom: '2rem' }}>
          Upload your telemetry file from any sim racing game
        </p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div
            className={`upload-zone ${dragging ? 'dragging' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('fileInput').click()}
          >
            <input
              id="fileInput"
              type="file"
              accept=".csv,.txt,.ibt,.ldx"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            {file ? (
              <div>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <h3>{file.name}</h3>
                <p style={{ color: '#999', marginTop: '0.5rem' }}>
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <p style={{ color: '#667eea', marginTop: '1rem' }}>
                  Click to select a different file
                </p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📤</div>
                <h3>Drop your telemetry file here</h3>
                <p style={{ color: '#999', marginTop: '0.5rem' }}>
                  or click to browse
                </p>
                <p style={{ color: '#666', marginTop: '1rem', fontSize: '0.875rem' }}>
                  Supports CSV, TXT, IBT, LDX formats
                </p>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Sim Type</label>
            <select
              value={simType}
              onChange={(e) => setSimType(e.target.value)}
            >
              <option value="iRacing">iRacing</option>
              <option value="ACC">Assetto Corsa Competizione</option>
              <option value="AC">Assetto Corsa</option>
              <option value="rFactor2">rFactor 2</option>
              <option value="F1">F1 Series</option>
              <option value="AMS2">Automobilista 2</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Track Name (Optional)</label>
            <input
              type="text"
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              placeholder="e.g., Spa-Francorchamps"
            />
          </div>

          <div className="form-group">
            <label>Car Name (Optional)</label>
            <input
              type="text"
              value={carName}
              onChange={(e) => setCarName(e.target.value)}
              placeholder="e.g., BMW M4 GT3"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !file}
            style={{ width: '100%' }}
          >
            {loading ? 'Analyzing...' : 'Upload & Analyze'}
          </button>
        </form>

        <div style={{ textAlign: 'center', margin: '2rem 0' }}>
          <p style={{ color: '#999', marginBottom: '1rem' }}>
            Don't have telemetry data? Try a demo analysis
          </p>
          <button
            className="btn btn-secondary"
            onClick={handleDemoUpload}
            disabled={loading}
          >
            {loading ? 'Creating Demo...' : '🎮 Create Demo Analysis'}
          </button>
        </div>

        <div className="analysis-card" style={{ marginTop: '2rem' }}>
          <h3>How to Export Telemetry</h3>
          <div style={{ marginTop: '1rem', lineHeight: '1.8' }}>
            <p><strong>iRacing:</strong> Use third-party tools like MoTeC or Sim Racing Telemetry</p>
            <p><strong>ACC:</strong> Enable telemetry output in settings, files saved to Documents folder</p>
            <p><strong>rFactor 2:</strong> Use MoTeC plugin or enable CSV export</p>
            <p style={{ color: '#999', marginTop: '1rem', fontSize: '0.875rem' }}>
              Most telemetry tools can export to CSV format which works with SimLap Pro
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Upload;
