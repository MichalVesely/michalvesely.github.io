import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function Navbar() {
  const navigate = useNavigate();
  const isAuthenticated = api.isAuthenticated();
  const user = api.getCurrentUser();

  const handleLogout = () => {
    api.logout();
    navigate('/');
  };

  return (
    <div className="navbar">
      <h1>🏎️ SimLap Pro</h1>
      <nav>
        <Link to="/">Home</Link>
        {isAuthenticated ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/upload">Upload</Link>
            {user?.subscription_tier === 'free' && (
              <Link to="/pricing">Upgrade</Link>
            )}
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/pricing">Pricing</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Sign Up</Link>
          </>
        )}
      </nav>
    </div>
  );
}

export default Navbar;
