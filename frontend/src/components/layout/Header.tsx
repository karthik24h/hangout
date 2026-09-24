import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import { apiFetch } from '../../services/api';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../../styles/App.css';
import CreateRoomModal from '../room/CreateRoomModal';

export default function Header() {
  const connectionStatus = useConnectionStatus();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const seed = Math.random().toString(36).substring(2, 15);
    setAvatarUrl(`https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`);

    const params = new URLSearchParams(location.search);
    const code = params.get('room');
    setRoomCode(code);
    setIsCreator(Boolean(code && localStorage.getItem('createdRoom') === code));
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
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('createdRoom');
    navigate('/login');
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleCopyRoom = () => {
    if (!roomCode) return;
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
      const response = await apiFetch(`/rooms/close/${roomCode}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Room closure failed');
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
        <span role="status" aria-live="polite">Server: {connectionStatus}</span>
        <div className="header-buttons">
          {isRoomPage && roomCode ? (
            <div className="room-code-info flex items-center gap-4">
              <div className="room-id text-lg text-white">
                <span>Room ID: </span><span className="text-blue-400 font-semibold">{roomCode}</span>
              </div>
              <button className="copy-room-btn bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md shadow font-medium transition" onClick={handleCopyRoom}>
                Copy Code
              </button>
              {isCreator ? (
                <button className="close-room-btn bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md shadow font-medium transition" onClick={handleCloseRoom}>
                  Close Room
                </button>
              ) : (
                <button className="leave-room-btn bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md shadow font-medium transition" onClick={handleLeaveRoom}>
                  Leave Room
                </button>
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
