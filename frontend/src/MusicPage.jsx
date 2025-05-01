import React from 'react';
import Header from './Header';
import './App.css';

export default function MusicPage() {
  return (
    <div className="music-page">
      <Header />
      <div className="content p-4">
        <h2>🎵 Music</h2>
        <p>Listen to music together with your friends!</p>
      </div>
    </div>
  );
}
