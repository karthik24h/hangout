import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css'; // Make sure the CSS file is linked properly

export default function CreateRoomModal({ onClose }) {
  const [roomName, setRoomName] = useState('');
  const [setPassword, setSetPassword] = useState(false);
  const [password, setPasswordValue] = useState('');
  const [error, setError] = useState('');
  const [mediaType, setMediaType] = useState('video'); // Added state for media type
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      setError('Room name is required.');
      return;
    }

    const body = { name: roomName.trim() };
    if (setPassword && password) {
      body.password = password;
    }

    try {
      const response = await fetch('http://localhost:5000/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (response.ok && data.roomCode) {
        localStorage.setItem('createdRoom', data.roomCode);
        onClose();
        // Redirect based on the media type selected
        if (mediaType === 'music') {
          navigate(`/music?room=${data.roomCode}`);
        } else {
          navigate(`/videos?room=${data.roomCode}`);
        }
      } else {
        setError(data.message || data.error || 'Failed to create room.');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      setError('Server error while creating room.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        <h2 className="modal-title">Create Room</h2>

        <input
          className="modal-input"
          type="text"
          placeholder="Room Name"
          value={roomName}
          onChange={(e) => {
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
            onChange={(e) => setSetPassword(e.target.checked)}
          />
          <label htmlFor="setPassword">Set a password</label>
        </div>

        {setPassword && (
          <input
            className="modal-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPasswordValue(e.target.value)}
          />
        )}

        {/* Media Type Dropdown */}
        <div className="media-type-dropdown">
          <label htmlFor="mediaType">Select Media Type</label>
          <select
            id="mediaType"
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value)}
            className="media-type-dropdown-select"
          >
            <option value="video">Video</option>
            <option value="music">Music</option>
          </select>
        </div>

        <button className="modal-create-button" onClick={handleCreateRoom}>
          Create Room
        </button>
      </div>
    </div>
  );
}
