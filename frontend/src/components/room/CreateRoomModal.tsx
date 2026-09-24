import { apiFetch } from '../../services/api';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateRoomModal({ onClose }: { onClose: () => void }) {
  const [roomName, setRoomName] = useState('');
  const [setPassword, setSetPassword] = useState(false);
  const [password, setPasswordValue] = useState('');
  const [error, setError] = useState('');
  const [mediaType, setMediaType] = useState<'video' | 'music'>('video');
  const [privacy, setPrivacy] = useState<'public' | 'private' | 'invite_only'>('public');
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      setError('Room name is required.');
      return;
    }

    const body: {
      name: string;
      type: 'video' | 'music';
      password?: string;
      privacy: 'public' | 'private' | 'invite_only';
    } = {
      name: roomName.trim(),
      type: mediaType,
      privacy,
    };
    if (setPassword && password) {
      body.password = password;
    }

    try {
      const response = await apiFetch('/rooms/create', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (response.ok && data.room) {
        localStorage.setItem('createdRoom', data.room.room_code);
        onClose();
        if (mediaType === 'music') {
          navigate(`/music?room=${data.room.room_code}`);
        } else {
          navigate(`/videos?room=${data.room.room_code}`);
        }
      } else {
        setError(data.error || 'Failed to create room.');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      setError('Server error while creating room.');
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-room-title"
    >
      <div className="modal">
        <div className="modal-header">
          <h2 id="create-room-title" className="modal-title">
            Create Room
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
              handleCreateRoom();
            }}
          >
            <div className="form-group mb-4">
              <label htmlFor="roomName" className="form-label">
                Room Name
              </label>
              <input
                id="roomName"
                type="text"
                className="form-input"
                placeholder="Enter room name"
                value={roomName}
                onChange={e => {
                  setRoomName(e.target.value);
                  setError('');
                }}
                required
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

            <div className="form-group mb-4">
              <div className="form-checkbox">
                <input
                  type="checkbox"
                  id="setPassword"
                  className="form-checkbox-input"
                  checked={setPassword}
                  onChange={e => setSetPassword(e.target.checked)}
                />
                <label htmlFor="setPassword">Set a password (makes room private)</label>
              </div>
            </div>

            {setPassword && (
              <div className="form-group mb-4">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPasswordValue(e.target.value)}
                />
              </div>
            )}

            <div className="form-group mb-4">
              <label htmlFor="mediaType" className="form-label">
                Media Type
              </label>
              <select
                id="mediaType"
                className="form-select"
                value={mediaType}
                onChange={e => setMediaType(e.target.value as 'video' | 'music')}
              >
                <option value="video">Video</option>
                <option value="music">Music</option>
              </select>
            </div>

            <div className="form-group mb-6">
              <label htmlFor="privacy" className="form-label">
                Privacy
              </label>
              <select
                id="privacy"
                className="form-select"
                value={privacy}
                onChange={e => setPrivacy(e.target.value as 'public' | 'private' | 'invite_only')}
              >
                <option value="public">Public</option>
                <option value="private">Private (password required)</option>
                <option value="invite_only">Invite Only</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Create Room
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
