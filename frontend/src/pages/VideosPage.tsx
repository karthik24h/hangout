import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import CreateRoomModal from '../components/room/CreateRoomModal';
import JoinRoomModal from '../components/room/JoinRoomModal';
import Icon from '../components/ui/Icon';
import { apiFetch } from '../services/api';
import './videos.css';

type Room = { id: number; name: string; type: 'video' | 'music'; room_code: string; member_count: string | number; status: string };

export default function VideosPage() {
  const [params] = useSearchParams();
  const roomCode = params.get('room');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [create, setCreate] = useState(false);
  const [join, setJoin] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    apiFetch('/rooms', { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('We couldn’t load your video rooms.');
        const data = await response.json();
        if (!controller.signal.aborted) setRooms(data.rooms.filter((room: Room) => room.type === 'video'));
      })
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load rooms.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [roomCode]);

  const selectedRoom = rooms.find(room => room.room_code === roomCode);
  return (
    <div className="dashboard videos-page">
      <Header />
      <div className="dash-shell">
        <Sidebar onCreate={() => setCreate(true)} onJoin={() => setJoin(true)} />
        <main className="dash-main videos-main">
          <div className="videos-heading"><div><h1>Make it a movie night.</h1></div>{!roomCode && <button className="videos-button videos-button--primary" onClick={() => setCreate(true)}><Icon name="plus" /> New video room</button>}</div>
          {roomCode && <div className="videos-room-banner" role="status"><span className="videos-live-dot" /><span>{loading ? 'Loading room…' : error ? 'Room details are unavailable.' : selectedRoom ? `${selectedRoom.name} · ${selectedRoom.member_count} watching` : 'This room is unavailable or you are not a member.'}</span><Link to="/videos">All video rooms</Link></div>}
          {roomCode ? <section className="videos-stage" aria-labelledby="stage-title"><div className="videos-stage__header"><div><p className="videos-eyebrow">SHARED SCREEN</p><h2 id="stage-title">Ready when you are.</h2></div><span className="videos-status"><span className="videos-live-dot" /> Waiting for media</span></div><div className="videos-player videos-player--empty"><div className="videos-player__icon"><Icon name="video" /></div><h3>No video selected</h3><p>Add a supported video link from the room to start watching together.</p><button className="videos-button videos-button--secondary" onClick={() => setJoin(true)}><Icon name="plus" /> Add media</button></div><div className="videos-stage__footer"><span>Playback sync will appear here once media is added.</span><span>Room code <strong>{roomCode}</strong></span></div></section> : <section className="videos-empty-hero"><div className="videos-empty-hero__art"><div className="videos-art-orbit videos-art-orbit--one" /><div className="videos-art-orbit videos-art-orbit--two" /><Icon name="video" /></div><div><p className="videos-eyebrow">YOUR WATCHSPACE</p><h2>Nothing queued yet.</h2><p>Create a room for a private watch party, or join one with an invite code. Your rooms and playback state will appear here.</p><div className="videos-actions"><button className="videos-button videos-button--primary" onClick={() => setCreate(true)}><Icon name="plus" /> Create a room</button><button className="videos-button videos-button--secondary" onClick={() => setJoin(true)}>Join with code</button></div></div></section>}
          <section className="videos-rooms" aria-labelledby="rooms-title"><div className="videos-section-heading"><div><p className="videos-eyebrow">YOUR ROOMS</p><h2 id="rooms-title">Video rooms</h2></div><span>{rooms.length} {rooms.length === 1 ? 'room' : 'rooms'}</span></div>{error && <p className="videos-message videos-message--error">{error}</p>}{loading ? <p className="videos-message">Loading your rooms…</p> : rooms.length === 0 ? <p className="videos-message">No video rooms yet. Your rooms will appear here after you create or join one.</p> : <div className="videos-room-list">{rooms.map(room => <Link className="videos-room-card" to={`/videos?room=${encodeURIComponent(room.room_code)}`} key={room.id}><span className="videos-room-card__icon"><Icon name="video" /></span><span><strong>{room.name}</strong><small>{room.member_count} members · {room.status}</small></span><span className="videos-room-card__arrow">→</span></Link>)}</div>}</section>
        </main>
      </div>
      {create && <CreateRoomModal onClose={() => setCreate(false)} initialType="video" />}
      {join && <JoinRoomModal onClose={() => setJoin(false)} />}
    </div>
  );
}
