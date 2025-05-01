import React from 'react';
import { Link } from 'react-router-dom';
import './App.css';

export default function SettingsPage() {
  return (
    <div className="settings-container">
      <h2>Account Settings</h2>

      <form className="settings-form">
        <label>
          Full Name
          <input type="text" placeholder="John Doe" />
        </label>

        <label>
          Email Address
          <input type="email" placeholder="john@example.com" />
        </label>

        <label>
          Password
          <input type="password" placeholder="********" />
        </label>

        <label>
          Profile Picture URL
          <input type="text" placeholder="https://example.com/avatar.jpg" />
        </label>

        <label>
          Notifications
          <select>
            <option>Enable All</option>
            <option>Email Only</option>
            <option>Disabled</option>
          </select>
        </label>

        <button type="submit" className="save-btn">Save Changes</button>
      </form>

      <div className="danger-zone">
        <h3>Danger Zone</h3>
        <button className="delete-account-btn">Delete Account</button>
      </div>

      <Link to="/" className="back-link">← Back to Home</Link>
    </div>
  );
}
