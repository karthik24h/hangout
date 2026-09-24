import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import './header-account.css';
import CreateRoomModal from '../room/CreateRoomModal';

export default function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [checkingCreator, setCheckingCreator] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
  );
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const profileRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(String(user?.id || 'hangout'))}&backgroundColor=f3edf2`;

  useEffect(() => {
    if (!isProfileOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) setIsProfileOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
        profileButtonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [isProfileOpen]);

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
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = nextTheme;
    setTheme(nextTheme);
  };

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

  return (
    <>
      <header className={`header${isRoomPage && roomCode ? ' header--room' : ''}`}>
        <div className="header-left">
          <Link to="/" className="header-logo">
            Hangout
          </Link>
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

          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {theme === 'light' ? (
                <path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z" />
              ) : (
                <>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
                </>
              )}
            </svg>
          </button>
          <div
            className="profile-container header-account"
            ref={profileRef}
            onBlur={event => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                setIsProfileOpen(false);
            }}
          >
            <button
              type="button"
              ref={profileButtonRef}
              className="header-profile-button"
              onClick={toggleProfile}
              aria-label="Account menu"
              aria-expanded={isProfileOpen}
              aria-controls="header-account-panel"
            >
              {avatarFailed ? (
                user?.name?.trim().slice(0, 2).toUpperCase() || 'H'
              ) : (
                <img src={avatarUrl} alt="" onError={() => setAvatarFailed(true)} />
              )}
            </button>
            {isProfileOpen && (
              <div className="header-account-panel" id="header-account-panel">
                <span className="header-account-eyebrow">YOUR ACCOUNT</span>
                <div className="header-account-identity">
                  <strong>{user?.name || 'User'}</strong>
                  <span>{user?.email || ''}</span>
                </div>
                <Link to="/settings" className="header-account-settings" onClick={closeProfile}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2" />
                  </svg>
                  Account settings<span aria-hidden="true">↗</span>
                </Link>
              </div>
            )}
          </div>
          <button
            type="button"
            className="header-logout"
            onClick={handleLogout}
            aria-label="Log out"
            title="Log out"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 4H4v16h5m6-12 4 4-4 4m-6-4h10" />
            </svg>
            <span>Log out</span>
          </button>
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
