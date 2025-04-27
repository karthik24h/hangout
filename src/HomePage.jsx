import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import './App.css';

export default function HomePage() {
  return (
    <div className="homepage">
      <Header />

      {/* Welcome Section */}
      <section className="welcome-section">
        <h2>Welcome to Hangout</h2>
        <p>Create or join a room to watch videos and listen to music together.</p>
        <div className="welcome-buttons">
          <button className="new-room-btn">New Room</button>
          <button className="join-room-btn">Join Room</button>
        </div>
      </section>

      {/* Tabs Section */}
      <nav className="tabs">
        <Link to="/music">
          <button>🎵 Music</button>
        </Link>
        <Link to="/videos">
          <button>▶️ Videos</button>
        </Link>
        <Link to="/favorites">
          <button>❤️ Favorites</button>
        </Link>
      </nav>

      {/* Rooms Section */}
      <section className="rooms-section">
        <h3>Rooms</h3>
        <div className="room-card">
          <div className="room-header">
            <span className="admin-badge">Admin</span>
            <h4>Admin – Listening Party</h4>
          </div>
          <p>Currently listening to: Chill Beats</p>
        </div>

        <div className="room-card">
          <h4>Movie Night</h4>
          <p>3 participants</p>
        </div>

        <div className="room-card">
          <h4>Lofi Stream</h4>
          <p>3 participants</p>
        </div>
      </section>
    </div>
  );
}
