import { apiFetch } from '../../services/api';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function JoinRoomModal({ onClose }: { onClose: () => void }) {
  const [roomCode, setRoomCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      setError('Room code is required.');
      return;
    }

    try {
      const response = await apiFetch(`/rooms/join/${roomCode.toUpperCase()}`, {
        method: 'POST',
        body: JSON.stringify({ password: password || undefined }),
      });

      const data = await response.json();
      if (response.ok && data.room) {
        onClose();
        if (data.room.type === 'music') {
          navigate(`/music?room=${data.room.room_code}`);
        } else {
          navigate(`/videos?room=${data.room.room_code}`);
        }
      } else {
        setError(data.error || 'Failed to join room');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      setError('Server error while joining room');
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-room-title"
    >
      <div className="modal">
        <div className="modal-header">
          <h2 id="join-room-title" className="modal-title">
            Join Room
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
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
          <form
            onSubmit={e => {
              e.preventDefault();
              handleJoinRoom();
            }}
          >
            <div className="form-group mb-4">
              <label htmlFor="roomCode" className="form-label">
                Room Code
              </label>
              <input
                id="roomCode"
                type="text"
                className="form-input"
                placeholder="Enter 6-character code"
                value={roomCode}
                onChange={e => {
                  setRoomCode(e.target.value.toUpperCase());
                  setError('');
                }}
                maxLength={6}
                required
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="form-group mb-4">
              <label htmlFor="password" className="form-label">
                Password (if required)
              </label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="alert alert-error mb-4" role="alert">
                <svg
                  className="alert-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div className="alert-content">
                  <p className="alert-message">{error}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Join Room
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
