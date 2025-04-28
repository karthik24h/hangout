import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './App.css';
import CreateRoomModal from './CreateRoomModal'; // Already mentioned

export default function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const toggleProfile = () => setIsProfileOpen(!isProfileOpen);
  const closeProfile = () => setIsProfileOpen(false);

  return (
    <>
      <header className="header">
        <h1 className="logo">Hangout</h1>
        <div className="header-buttons">
          <Link to="/search">
            {/* You can add search button later */}
          </Link>

          <button className="create-room-btn" onClick={openModal}>
            Create Room
          </button>

          <div className="profile-container">
            <div className="profile-icon" onClick={toggleProfile}>👤</div>

            {isProfileOpen && (
              <div className="profile-popup">
                <div className="profile-info">
                  <h3>John Doe</h3> {/* You can dynamically set this */}
                  <p>john@example.com</p>
                </div>
                <div className="profile-actions">
                  <button onClick={closeProfile}>Settings</button>
                  <button onClick={closeProfile}>Logout</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {isModalOpen && <CreateRoomModal onClose={closeModal} />}
    </>
  );
}
