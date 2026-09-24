import { apiFetch } from '../../services/api';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/App.css';

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
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>
          ×
        </button>
        <h2 className="modal-title">Join Room</h2>

        <input
          className="modal-input"
          type="text"
          placeholder="Room Code"
          value={roomCode}
          onChange={e => {
            setRoomCode(e.target.value.toUpperCase());
            setError('');
          }}
          maxLength={6}
        />

        <input
          className="modal-input"
          type="password"
          placeholder="Password (if required)"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        {error && <p className="error-text">{error}</p>}

        <button className="modal-create-button" onClick={handleJoinRoom}>
          Join Room
        </button>
      </div>
    </div>
  );
}
