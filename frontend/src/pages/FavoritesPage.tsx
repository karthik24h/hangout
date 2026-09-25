import { useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import CreateRoomModal from '../components/room/CreateRoomModal';
import JoinRoomModal from '../components/room/JoinRoomModal';
import Icon from '../components/ui/Icon';
import './favorites.css';

export default function FavoritesPage() {
  const [create, setCreate] = useState(false);
  const [join, setJoin] = useState(false);
  return (
    <div className="dashboard favorites-page">
      <Header />
      <div className="dash-shell">
        <Sidebar onCreate={() => setCreate(true)} onJoin={() => setJoin(true)} />
        <main className="dash-main favorites-main">
          <div className="favorites-heading"><div><p className="favorites-eyebrow">YOUR COLLECTION</p><h1>Favorites</h1><p>Keep the things you want to come back to, all in one place.</p></div><span className="favorites-count">0 saved</span></div>
          <section className="favorites-empty" aria-labelledby="favorites-empty-title"><div className="favorites-empty__icon"><Icon name="heart" /></div><div><p className="favorites-eyebrow">NOTHING SAVED YET</p><h2 id="favorites-empty-title">Your favorites will live here.</h2><p>Save music and videos while you explore Hangout, and they’ll be ready whenever you want to press play again.</p><div className="favorites-actions"><button className="favorites-button favorites-button--primary" onClick={() => setCreate(true)}><Icon name="plus" /> Create a room</button><button className="favorites-button" onClick={() => setJoin(true)}>Join with a code</button></div></div></section>
        </main>
      </div>
      {create && <CreateRoomModal onClose={() => setCreate(false)} initialType="music" />}
      {join && <JoinRoomModal onClose={() => setJoin(false)} />}
    </div>
  );
}
