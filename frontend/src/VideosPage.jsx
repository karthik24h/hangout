import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import './App.css';

export default function VideosPage() {
  const location = useLocation();
  // eslint-disable-next-line no-unused-vars
  const params = new URLSearchParams(location.search);
  // const roomCode = params.get('room');

  return (
    <div className="videos-page-container min-h-screen bg-gray-900 text-white">
      {/* Global Header */}
      <Header />

      {/* Video and Chat Section */}
      <div className="video-chat-wrapper max-w-6xl mx-auto mt-10 bg-gray-800 rounded-xl p-6 flex gap-6 shadow-xl">
        {/* Left: Video Player */}
        <div className="video-section w-2/3">
          <div className="bg-black rounded-lg overflow-hidden">
            <video controls className="w-full rounded-lg">
              <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="mt-2 text-sm text-gray-300">0:23 / 3:45</div>
          <button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">
            Add Media
          </button>
        </div>

        {/* Right: Chat Section */}
        <div className="chat-section w-1/3 bg-gray-900 rounded-lg p-4 flex flex-col">
          <h3 className="text-xl font-semibold mb-4">Chat</h3>
          <div className="chat-messages flex-1 overflow-y-auto bg-gray-800 rounded-lg p-3 mb-3 space-y-2 text-sm">
            <p><strong>User 1:</strong> Hello!</p>
            <p><strong>User 1:</strong> Hi!</p>
            <p><strong>User 1:</strong> This movie is great</p>
            <p><strong>User 1:</strong> Yes, I love this scene.</p>
          </div>
          <div className="chat-input mt-auto">
            <input
              type="text"
              placeholder="Message"
              className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}