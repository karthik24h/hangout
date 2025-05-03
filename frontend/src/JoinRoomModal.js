import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css'; // Ensure your CSS has modal styles

export default function JoinRoomModal({ onClose }) {
  const [roomCode, setRoomCode] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleJoinRoom = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/rooms/join/${roomCode}`);
      const data = await response.json();

      if (data.room) {
        // Optionally check password match here if backend supports it
        onClose();
        navigate(`/videos?room=${roomCode}`);
      } else {
        alert('Room not found');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Server error');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <button className="close-button" onClick={onClose}>
          ×
        </button>
        <h2>Join Room</h2>
        <input
          type="text"
          placeholder="Room Code"
          className="input-field"
          value={roomCode}
          onChange={e => setRoomCode(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password (optional)"
          className="input-field"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button className="primary-button" onClick={handleJoinRoom}>
          Join Room
        </button>
      </div>
    </div>
  );
}
