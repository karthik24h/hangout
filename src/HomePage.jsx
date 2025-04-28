import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import CreateRoomModal from './CreateRoomModal'; 
import JoinRoomModal from './JoinRoomModal'; // Import the JoinRoomModal
import './App.css';

export default function HomePage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false); // Add join modal state

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);

  const openJoinModal = () => setIsJoinModalOpen(true);
  const closeJoinModal = () => setIsJoinModalOpen(false);

  return (
    <div className="homepage">
      <Header />

      {/* Welcome Section */}
      <section className="welcome-section">
        <h2>Welcome to Hangout</h2>
        <p>Create or join a room to watch videos and listen to music together.</p>
        <div className="welcome-buttons">
          <button className="new-room-btn" onClick={openCreateModal}>
            New Room
          </button>
          <button className="join-room-btn" onClick={openJoinModal}>
            Join Room
          </button>
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

      {/* Modals */}
      {isCreateModalOpen && <CreateRoomModal onClose={closeCreateModal} />}
      {isJoinModalOpen && <JoinRoomModal onClose={closeJoinModal} />}
    </div>
  );
}
