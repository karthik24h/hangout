import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import './App.css';

export default function VideosPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const roomCode = params.get('room');

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    alert('Room code copied to clipboard!');
  };

  return (
    <div className="videos-page min-h-screen bg-gray-100">
      <Header />

      <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow-lg">
        <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
          <span>📺</span> Videos Room
        </h2>
        <p className="text-gray-600 mb-6">
          Watch videos with friends in real-time sync. Share your room code to invite others.
        </p>

        {roomCode ? (
          <div className="room-info bg-blue-50 p-4 rounded-xl border border-blue-200">
            <p className="text-lg">
              You're in Room: <span className="font-semibold text-blue-600">{roomCode}</span>
            </p>
            <button
              onClick={handleCopy}
              className="mt-4 px-5 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
            >
              Copy Room Code
            </button>
          </div>
        ) : (
          <p className="text-red-500">No room code found. Please create or join a room first.</p>
        )}
      </div>
    </div>
  );
}
