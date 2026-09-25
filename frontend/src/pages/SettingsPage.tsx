import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import CreateRoomModal from '../components/room/CreateRoomModal';
import JoinRoomModal from '../components/room/JoinRoomModal';
import Icon from '../components/ui/Icon';
import './settings.css';

export default function SettingsPage() {
  const [create, setCreate] = useState(false);
  const [join, setJoin] = useState(false);
  return <div className="dashboard settings-page"><Header /><div className="dash-shell"><Sidebar onCreate={() => setCreate(true)} onJoin={() => setJoin(true)} /><main className="dash-main settings-main"><div className="settings-heading"><div><h1>Settings</h1><p>Manage your profile and how Hangout feels.</p></div></div><section className="settings-card"><div className="settings-card__intro"><div className="settings-avatar"><Icon name="settings" /></div><div><h2>Account details</h2><p>Keep your personal information up to date.</p></div></div><form className="settings-form" onSubmit={event => event.preventDefault()}><div className="settings-grid"><label>Full Name<input type="text" placeholder="Your name" /></label><label>Email Address<input type="email" placeholder="you@example.com" /></label></div><label>Password<input type="password" placeholder="Enter a new password" /></label><label>Profile Picture URL<input type="url" placeholder="https://example.com/avatar.jpg" /></label><label>Notifications<select defaultValue="all"><option value="all">Enable all</option><option value="email">Email only</option><option value="none">Disabled</option></select></label><button type="submit" className="settings-button">Save changes</button></form><div className="settings-danger"><div><h2>Danger zone</h2><p>Delete your account and associated data permanently.</p></div><button type="button">Delete account</button></div><Link to="/" className="settings-back">← Back to overview</Link></section></main></div>{create && <CreateRoomModal onClose={() => setCreate(false)} initialType="video" />}{join && <JoinRoomModal onClose={() => setJoin(false)} />}</div>;
}
