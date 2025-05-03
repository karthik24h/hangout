import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import './App.css';

export default function VideosPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const roomCode = params.get('room');

  return (
    <div className="videos-page">
      <Header />
      <div className="content p-4">
        <h2>▶️ Videos</h2>
        <p>Watch videos together in sync!</p>

        {roomCode && (
          <div className="room-info mt-3">
            <p>
              You're in Room: <strong>{roomCode}</strong>
            </p>
            <button
              className="primary-button"
              onClick={() => {
                navigator.clipboard.writeText(roomCode);
                alert('Room code copied!');
              }}
            >
              Copy Room Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
