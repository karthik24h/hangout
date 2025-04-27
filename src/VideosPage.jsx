import React from 'react';
import Header from './Header';
import './App.css';

export default function VideosPage() {
  return (
    <div className="videos-page">
      <Header />
      <div className="content p-4">
        <h2>▶️ Videos</h2>
        <p>Watch videos together in sync!</p>
      </div>
    </div>
  );
}
