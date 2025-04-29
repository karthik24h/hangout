import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './App.css';
import CreateRoomModal from './CreateRoomModal'; // Already mentioned

export default function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const toggleProfile = () => setIsProfileOpen(!isProfileOpen);
  const closeProfile = () => setIsProfileOpen(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
    closeProfile();
  };

  const confirmLogout = () => {
    // Add your logout logic here
    setShowLogoutConfirm(false);
    navigate('/login'); // Redirect to login page
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

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
                  <button onClick={handleLogout}>Logout</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {isModalOpen && <CreateRoomModal onClose={closeModal} />}
      
      {showLogoutConfirm && (
        <div className="logout-confirm-overlay">
          <div className="logout-confirm-modal">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to logout?</p>
            <div className="logout-confirm-buttons">
              <button className="confirm-btn" onClick={confirmLogout}>Confirm</button>
              <button className="cancel-btn" onClick={cancelLogout}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
