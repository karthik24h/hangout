import React from 'react';
import Header from './Header';
import './App.css';

export default function FavoritesPage() {
  return (
    <div className="favorites-page">
      <Header />
      <div className="content p-4">
        <h2>❤️ Favorites</h2>
        <p>Here are your saved favorite music and videos.</p>
      </div>
    </div>
  );
}
