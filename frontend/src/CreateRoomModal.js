import React from 'react';
import './App.css'; // We will create this CSS

export default function CreateRoomModal({ onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        <h2 className="modal-title">Create Room</h2>
        <input className="modal-input" type="text" placeholder="Room Name" />
        <input className="modal-input" type="password" placeholder="Password (optional)" />
        <div className="modal-checkbox">
          <input type="checkbox" id="setPassword" />
          <label htmlFor="setPassword">Set a password</label>
        </div>
        <button className="modal-create-button">Create Room</button>
      </div>
    </div>
  );
}
