import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './App.css';
import CreateRoomModal from './CreateRoomModal'; // We will create this

export default function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <header className="header">
        <h1 className="logo">Hangout</h1>
        <div className="header-buttons">
          <Link to="/search">
            {/* <button>🔍 Search</button> */}
          </Link>
          <button className="create-room-btn" onClick={openModal}>
            Create Room
          </button>
          <div className="profile-icon">👤</div>
        </div>
      </header>

      {isModalOpen && <CreateRoomModal onClose={closeModal} />}
    </>
  );
}
