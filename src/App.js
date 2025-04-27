import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import MusicPage from './MusicPage';
import VideosPage from './VideosPage';
import FavoritesPage from './FavoritesPage';
// import SearchPage from './SearchPage'; // optional if you created SearchPage.js

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/music" element={<MusicPage />} />
        <Route path="/videos" element={<VideosPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        {/* <Route path="/search" element={<SearchPage />} /> */}
      </Routes>
    </Router>
  );
}
