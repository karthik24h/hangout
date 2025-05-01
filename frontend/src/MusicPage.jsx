import React from 'react';
import Header from './Header';
import './App.css';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

export default function MusicPage() {
  return (
    <div className="music-page">
      <Header />
      <div className="content p-4">
        <h2>🎵 Music</h2>
        <p>Listen to music together with your friends!</p>
        <AudioPlayer
          autoPlay
          src="http://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3"
          onPlay={e => console.log("onPlay")}
          // other props here
        />
      </div>
    </div>
  );
}
