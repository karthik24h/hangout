import React from 'react';
import { Link } from 'react-router-dom';
import './App.css';

export default function Header() {
  return (
    <header className="header">
      <h1 className="logo">Hangout</h1>
      <div className="header-buttons">
        <Link to="/search">
          <button>🔍 Search</button>
        </Link>
        <button className="create-room-btn">Create Room</button>
        <div className="profile-icon">👤</div>
      </div>
    </header>
  );
}
