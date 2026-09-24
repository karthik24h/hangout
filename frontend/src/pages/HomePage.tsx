import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import CreateRoomModal from '../components/room/CreateRoomModal';
import JoinRoomModal from '../components/room/JoinRoomModal';
import Icon from '../components/ui/Icon';
import { apiFetch } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

type Room = {
  id: number;
  name: string;
  type: 'music' | 'video';
  room_code: string;
  member_count: string | number;
  status: string;
  privacy: string;
};
export default function HomePage() {
  const { user } = useAuth();
  const [create, setCreate] = useState(false);
  const [join, setJoin] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    apiFetch('/rooms', { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Unable to load your rooms. Please try again.');
        const data = await response.json();
        if (!controller.signal.aborted) setRooms(data.rooms);
      })
      .catch(err => {
        if (!controller.signal.aborted)
          setError(err instanceof Error ? err.message : 'Unable to load rooms.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [retry]);
  const visibleRooms = rooms.filter(
    room =>
      (filter === 'all' || room.type === filter) &&
      room.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="dashboard">
      <Header />
      <div className="dash-shell">
        <Sidebar onCreate={() => setCreate(true)} onJoin={() => setJoin(true)} />
        <main className="dash-main">
          <div className="dash-page-heading">
            <div>
              <h1>
                Hey {user?.name?.split(' ')[0] || 'there'}
                <span>, welcome back.</span>
              </h1>
              <p>A little time together goes a long way.</p>
            </div>
            <span className="dash-page-tag">Your everyday escape</span>
          </div>
          <section className="dash-hero" aria-labelledby="dash-hero-title">
            <div className="dash-hero-copy">
              <span className="dash-eyebrow">LESS SCROLLING. MORE CONNECTING.</span>
              <h2 id="dash-hero-title">
                Same moment.
                <br />
                <em>Any distance.</em>
              </h2>
              <p>
                A movie night, a shared playlist, or just your favorite people. Make a room for it.
              </p>
              <div className="dash-actions">
                <button className="dash-button primary" onClick={() => setCreate(true)}>
                  <Icon name="plus" />
                  Create a room
                </button>
                <button className="dash-button" onClick={() => setJoin(true)}>
                  Join with a code
                  <Icon name="arrow" />
                </button>
              </div>
            </div>
            <div className="dash-hero-art" aria-hidden="true">
              <div className="dash-orbit" />
              <div className="dash-record">
                <div />
              </div>
              <div className="dash-art-label">
                <Icon name="music" />
                <span>A little more in sync.</span>
                <div className="dash-wave">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </div>
              <span className="dash-art-spark">✧</span>
            </div>
          </section>
          <section className="dash-shortcuts" aria-label="Explore Hangout">
            <Link to="/music">
              <span className="dash-icon-tile">
                <Icon name="music" />
              </span>
              <div>
                <h2>Find your rhythm</h2>
                <p>Listen to something together</p>
              </div>
              <Icon name="arrow" />
            </Link>
            <Link to="/videos">
              <span className="dash-icon-tile">
                <Icon name="video" />
              </span>
              <div>
                <h2>Make it a movie night</h2>
                <p>Press play. Share the moment.</p>
              </div>
              <Icon name="arrow" />
            </Link>
            <Link to="/favorites">
              <span className="dash-icon-tile">
                <Icon name="heart" />
              </span>
              <div>
                <h2>Keep the good stuff</h2>
                <p>Revisit your favorites</p>
              </div>
              <Icon name="arrow" />
            </Link>
          </section>
          <section className="dash-rooms" aria-labelledby="dash-rooms-title">
            <div className="dash-section-heading">
              <div>
                <h2 id="dash-rooms-title">
                  Your rooms {!loading && !error && <span>{rooms.length}</span>}
                </h2>
                <p>Pick up where you left off, or start something new.</p>
              </div>
              <label className="dash-search">
                <Icon name="search" />
                <input
                  aria-label="Search your rooms"
                  placeholder="Search rooms…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </label>
            </div>
            <div className="dash-filters" role="group" aria-label="Filter rooms">
              {[
                ['all', 'All rooms'],
                ['music', 'Music'],
                ['video', 'Videos'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            {loading ? (
              <div className="dash-empty" role="status">
                Loading your rooms…
              </div>
            ) : error ? (
              <div className="dash-empty" role="alert">
                <h3>Let’s try that again</h3>
                <p>{error}</p>
                <button
                  className="dash-button"
                  onClick={() => {
                    setLoading(true);
                    setError('');
                    setRetry(v => v + 1);
                  }}
                >
                  Retry
                </button>
              </div>
            ) : visibleRooms.length === 0 ? (
              <div className="dash-empty">
                <span className="dash-empty-icon">
                  <Icon name={rooms.length ? 'search' : 'people'} />
                </span>
                <h3>{rooms.length ? 'No matching rooms' : 'Your people. Your first room.'}</h3>
                <p>
                  {rooms.length
                    ? 'Try another name or choose a different filter.'
                    : 'Start a space for your next movie night or listening session.'}
                </p>
                <button
                  className="dash-button"
                  onClick={() => {
                    if (rooms.length) {
                      setFilter('all');
                      setSearch('');
                    } else setCreate(true);
                  }}
                >
                  {rooms.length ? 'Clear filters' : 'Create your first room'}
                  <Icon name={rooms.length ? 'arrow' : 'plus'} />
                </button>
              </div>
            ) : (
              <div className="dash-room-grid">
                {visibleRooms.map(room => (
                  <article className="dash-room" key={room.id}>
                    <div className={`dash-room-cover ${room.type}`}>
                      <Icon name={room.type === 'music' ? 'music' : 'video'} />
                      <span>{room.type === 'music' ? 'LISTEN TOGETHER' : 'WATCH TOGETHER'}</span>
                    </div>
                    <div className="dash-room-body">
                      <div className="dash-room-meta">
                        <span>{room.privacy.replace('_', ' ')}</span>
                        <span>{room.status === 'active' ? 'Open room' : 'Closed'}</span>
                      </div>
                      <h3>{room.name}</h3>
                      <p>
                        <Icon name="people" />
                        {room.member_count} {Number(room.member_count) === 1 ? 'person' : 'people'}{' '}
                        in this room
                      </p>
                      {room.status === 'active' ? (
                        <Link
                          className="dash-room-link"
                          to={`/${room.type === 'music' ? 'music' : 'videos'}?room=${encodeURIComponent(room.room_code)}`}
                        >
                          Open room
                          <Icon name="arrow" />
                        </Link>
                      ) : (
                        <span className="dash-room-closed">This room has ended</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
          <footer className="dash-footer">
            Made for moments together.<span>Hangout.</span>
          </footer>
        </main>
      </div>
      {create && <CreateRoomModal onClose={() => setCreate(false)} />}
      {join && <JoinRoomModal onClose={() => setJoin(false)} />}
    </div>
  );
}
