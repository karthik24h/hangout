import React from 'react';
import Header from './Header';
import './App.css';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

export default function MusicPage() {
  return (
    <div className="music-player-container">
      <Header />
      <div className="music-player-content">
        <div className="music-player-queue">
          <h3>Playlist Queue</h3>
          <ul>
            <li>Video Title</li>
            <li>Song Title</li>
            <li>Song Title</li>
          </ul>
        </div>
        <div className="music-player-main">
          <div className="music-player-placeholder">
            <div className="music-player-play-button">▶</div>
          </div>
          <AudioPlayer
            autoPlay={false}
            src="http://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3"
            onPlay={e => console.log("onPlay")}
            customAdditionalControls={[]}
            customVolumeControls={[]}
            className="music-player-audio"
          />
          <div className="music-player-actions">
            <button className="music-player-add-btn">+ Add Media</button>
            <button className="music-player-add-btn">Add Media</button>
          </div>
        </div>
        <div className="music-player-chat">
          <h3>Chat</h3>
          <div className="music-player-chat-messages">
            <p><strong>User1:</strong> Hey, Hiherese!</p>
            <p><strong>User2:</strong> User1, Play?</p>
            <p><strong>User3:</strong> User3, Chat</p>
            <p><strong>User4:</strong> User : Welcome as</p>
          </div>
          <input
            type="text"
            placeholder="Type a message..."
            className="music-player-chat-input"
          />
        </div>
      </div>
    </div>
  );
}