import React from 'react';
import './App.css'; // Assume you have styling or you can create it

export default function JoinRoomModal({ onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <button className="close-button" onClick={onClose}>
          ×
        </button>
        <h2>Join Room</h2>
        <input type="text" placeholder="Room ID" className="input-field" />
        <input type="password" placeholder="Password" className="input-field" />
        <button className="primary-button">Join Room</button>
      </div>
    </div>
  );
}
