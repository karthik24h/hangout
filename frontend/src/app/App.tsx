import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import MusicPage from '../pages/MusicPage';
import VideosPage from '../pages/VideosPage';
import FavoritesPage from '../pages/FavoritesPage';
import Signup from '../pages/auth/Signup';
import Login from '../pages/auth/Login';
import PrivateRoute from '../components/auth/PrivateRoute';
import SettingsPage from '../pages/SettingsPage';

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
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}
