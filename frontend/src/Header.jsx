import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import CreateRoomModal from './CreateRoomModal';

export default function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [roomCode, setRoomCode] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // You can replace this with user-specific info like email or ID
    const seed = Math.random().toString(36).substring(2, 15);
    setAvatarUrl(`https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`);

    const params = new URLSearchParams(location.search);
    const code = params.get('room');
    if (code) {
      setRoomCode(code);
      const creator = localStorage.getItem('createdRoom');
      if (creator === code) setIsCreator(true);
    }
  }, [location.search]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const toggleProfile = () => setIsProfileOpen(!isProfileOpen);
  const closeProfile = () => setIsProfileOpen(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
    closeProfile();
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    navigate('/login');
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleCopyRoom = () => {
    navigator.clipboard.writeText(roomCode);
    alert('Room code copied!');
  };

  const handleLeaveRoom = () => {
    if (window.confirm('Are you sure you want to leave the room?')) {
      navigate('/');
    }
  };

  const handleCloseRoom = async () => {
    const confirm = window.confirm('Are you sure you want to close this room for everyone?');
    if (!confirm) return;

    try {
      await fetch(`http://localhost:5000/api/rooms/close/${roomCode}`, {
        method: 'DELETE',
      });
      localStorage.removeItem('createdRoom');
      navigate('/');
    } catch (error) {
      console.error('Error closing room:', error);
      alert('Failed to close the room.');
    }
  };

  const isRoomPage = location.pathname === '/videos' || location.pathname === '/music';

  return (
    <>
      <header className="header">
        <h1 className="logo">Hangout</h1>
        <div className="header-buttons">
          {isRoomPage && roomCode ? (
            <div className="room-code-info">
              {/* <p className="room-code">Room: <strong>{roomCode}</strong></p> */}
              {/* <button className="copy-room-btn" onClick={handleCopyRoom}>Copy Code</button> */}
              {isCreator ? (
                <button className="close-room-btn" onClick={handleCloseRoom}>Close Room</button>
              ) : (
                <button className="leave-room-btn" onClick={handleLeaveRoom}>Leave Room</button>
              )}
            </div>
          ) : (
            <button className="create-room-btn" onClick={openModal}>
              Create Room
            </button>
          )}

          <div className="profile-container">
            <img src={avatarUrl} alt="User Avatar" className="profile-avatar" onClick={toggleProfile} />

            {isProfileOpen && (
              <div className="profile-popup">
                <div className="profile-info">
                  <h3>John Doe</h3>
                  <p>john@example.com</p>
                </div>
                <div className="profile-actions">
                  <Link to="/settings" className="settings-button-link" onClick={closeProfile}>
                    Settings
                  </Link>
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
