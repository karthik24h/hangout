import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import MusicPage from './MusicPage';
import VideosPage from './VideosPage';
import FavoritesPage from './FavoritesPage';
import Signup from './pages/Signup';
import Login from './pages/Login';
import PrivateRoute from './PrivateRoute'; 
import SettingsPage from './SettingsPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/music"
          element={
            <PrivateRoute>
              <MusicPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/videos"
          element={
            <PrivateRoute>
              <VideosPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <PrivateRoute>
              <FavoritesPage />
            </PrivateRoute>
          }
        />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Router>
  );
}
