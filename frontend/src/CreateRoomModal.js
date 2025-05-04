import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css'; // Ensure this contains your modal styles

export default function CreateRoomModal({ onClose }) {
  const [roomName, setRoomName] = useState('');
  const [setPassword, setSetPassword] = useState(false);
  const [password, setPasswordValue] = useState('');
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    const body = { name: roomName };
    if (setPassword && password) {
      body.password = password; // Optionally add password to backend
    }

    try {
      const response = await fetch('http://localhost:5000/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (data.roomCode) {
        // Save the room code in localStorage to track the creator
        localStorage.setItem('createdRoom', data.roomCode);

        onClose(); // Close modal
        navigate(`/videos?room=${data.roomCode}`); // Navigate to videos page with room
      } else {
        alert(data.error || 'Room creation failed');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Server error');
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
          onChange={e => setRoomName(e.target.value)}
        />

        <div className="modal-checkbox">
          <input
            type="checkbox"
            id="setPassword"
            checked={setPassword}
            onChange={e => setSetPassword(e.target.checked)}
          />
          <label htmlFor="setPassword">Set a password</label>
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

        <button className="modal-create-button" onClick={handleCreateRoom}>
          Create Room
        </button>
      </div>
    </div>
  );
}
