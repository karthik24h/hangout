import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import CreateRoomModal from '../room/CreateRoomModal';

export default function Header() {
  const connectionStatus = useConnectionStatus();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [checkingCreator, setCheckingCreator] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const checkCreator = useCallback(
    async (code: string) => {
      setCheckingCreator(true);
      try {
        const response = await apiFetch(`/rooms/${code}`);
        if (response.ok) {
          const data = await response.json();
          setIsCreator(data.room?.host_id === user?.id);
        }
      } catch (error) {
        console.error('Error checking room creator:', error);
      } finally {
        setCheckingCreator(false);
      }
    },
    [user]
  );

  useEffect(() => {
    const seed = Math.random().toString(36).substring(2, 15);
    // Initial avatar generation - setState in effect is intentional for initial load
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAvatarUrl(`https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`);

    const params = new URLSearchParams(location.search);
    const code = params.get('room');
    // Initial room code state - setState in effect is intentional for initial load
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRoomCode(code);
    // Initial creator state - setState in effect is intentional for initial load
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsCreator(false);

    if (code) {
      checkCreator(code);
    }
  }, [location.search, checkCreator]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const toggleProfile = () => setIsProfileOpen(!isProfileOpen);
  const closeProfile = () => setIsProfileOpen(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
    closeProfile();
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
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
      const response = await apiFetch(`/rooms/${roomCode}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Room closure failed');
      navigate('/');
    } catch (error) {
      console.error('Error closing room:', error);
      alert('Failed to close the room.');
    }
  };

  const isRoomPage = location.pathname === '/videos' || location.pathname === '/music';
  const statusClass =
    connectionStatus === 'connected'
      ? 'connected'
      : connectionStatus === 'connecting'
        ? 'connecting'
        : 'disconnected';

  return (
    <>
      <header className="header">
        <div className="header-left">
          <Link to="/" className="header-logo">
            Hangout
          </Link>
        </div>
        <div className="header-center">
          <span className="header-status" role="status" aria-live="polite">
            <span className={`header-status-dot ${statusClass}`} aria-hidden="true"></span>
            Server: {connectionStatus}
          </span>
        </div>
        <div className="header-right header-actions">
          {isRoomPage && roomCode ? (
            <div className="header-room-info">
              <span className="room-code">Room ID: {roomCode}</span>
              <button className="btn btn-secondary btn-sm" onClick={handleCopyRoom}>
                Copy Code
              </button>
              {checkingCreator ? (
                <span className="text-muted text-sm">Loading...</span>
              ) : isCreator ? (
                <button className="btn btn-danger btn-sm" onClick={handleCloseRoom}>
                  Close Room
                </button>
              ) : (
                <button className="btn btn-secondary btn-sm" onClick={handleLeaveRoom}>
                  Leave Room
                </button>
              )}
            </div>
          ) : (
            <button className="btn btn-primary" onClick={openModal}>
              Create Room
            </button>
          )}

          <div className="profile-container">
            <img src={avatarUrl} alt="User Avatar" className="avatar" onClick={toggleProfile} />

            {isProfileOpen && (
              <div className="dropdown-menu" role="menu">
                <div className="profile-info">
                  <h3 className="text-sm font-semibold">{user?.name || 'User'}</h3>
                  <p className="text-xs text-muted">{user?.email || ''}</p>
                </div>
                <hr className="dropdown-divider" />
                <Link
                  to="/settings"
                  className="dropdown-item"
                  onClick={closeProfile}
                  role="menuitem"
                >
                  Settings
                </Link>
                <button className="dropdown-item" onClick={handleLogout} role="menuitem">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {isModalOpen && <CreateRoomModal onClose={closeModal} />}

      {showLogoutConfirm && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
        >
          <div className="modal">
            <div className="modal-header">
              <h2 id="logout-title" className="modal-title">
                Confirm Logout
              </h2>
              <button className="modal-close" onClick={cancelLogout} aria-label="Close">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p className="text-secondary">Are you sure you want to logout?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={cancelLogout}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmLogout}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
