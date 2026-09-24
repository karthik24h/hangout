import { apiFetch } from '../../services/api';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/App.css';

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
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>
          ×
        </button>
        <h2 className="modal-title">Create Room</h2>

        <input
          className="modal-input"
          type="text"
          placeholder="Room Name"
          value={roomName}
          onChange={e => {
            setRoomName(e.target.value);
            setError('');
          }}
        />

        {error && <p className="error-text">{error}</p>}

        <div className="modal-checkbox">
          <input
            type="checkbox"
            id="setPassword"
            checked={setPassword}
            onChange={e => setSetPassword(e.target.checked)}
          />
          <label htmlFor="setPassword">Set a password (makes room private)</label>
        </div>

        {setPassword && (
          <input
            className="modal-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPasswordValue(e.target.value)}
          />
        )}

        <div className="media-type-dropdown">
          <label htmlFor="mediaType">Select Media Type</label>
          <select
            id="mediaType"
            value={mediaType}
            onChange={e => setMediaType(e.target.value as 'video' | 'music')}
            className="media-type-dropdown-select"
          >
            <option value="video">Video</option>
            <option value="music">Music</option>
          </select>
        </div>

        <div className="media-type-dropdown">
          <label htmlFor="privacy">Privacy</label>
          <select
            id="privacy"
            value={privacy}
            onChange={e => setPrivacy(e.target.value as 'public' | 'private' | 'invite_only')}
            className="media-type-dropdown-select"
          >
            <option value="public">Public</option>
            <option value="private">Private (password required)</option>
            <option value="invite_only">Invite Only</option>
          </select>
        </div>

        <button className="modal-create-button" onClick={handleCreateRoom}>
          Create Room
        </button>
      </div>
    </div>
  );
}
