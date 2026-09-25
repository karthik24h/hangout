import { readAudioDetails } from '../lib/audioMetadata';
import SharedMusic from '../components/music/SharedMusic';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import CreateRoomModal from '../components/room/CreateRoomModal';
import JoinRoomModal from '../components/room/JoinRoomModal';
import Icon from '../components/ui/Icon';
import { apiFetch } from '../services/api';
import '../styles/dashboard.css';
import './music.css';

type Track = {
  id: string;
  title: string;
  src: string;
  source: string;
  artist?: string;
  album?: string;
  artwork?: string;
};
type Room = {
  id: number;
  name: string;
  type: string;
  room_code: string;
  member_count: string | number;
  status: string;
};
export default function MusicPage() {
  const [params] = useSearchParams();
  const code = params.get('room');
  const [create, setCreate] = useState(false);
  const [join, setJoin] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [activeId, setActiveId] = useState('');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const continuePlayback = useRef(false);
  const lastVolume = useRef(1);
  const timeLabel = (value: number) =>
    `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomError, setRoomError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [revision, setRevision] = useState(0);
  const audio = useRef<HTMLAudioElement>(null);
  const files = useRef<HTMLInputElement>(null);
  const objectUrls = useRef(new Set<string>());
  const active = tracks.find(track => track.id === activeId);
  const selectedRoom = rooms.find(room => room.room_code === code);

  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      urls.forEach(value => URL.revokeObjectURL(value));
      urls.clear();
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    apiFetch('/rooms', { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('We couldn’t load your music rooms.');
        const data = await response.json();
        if (!controller.signal.aborted)
          setRooms(data.rooms.filter((room: Room) => room.type === 'music'));
      })
      .catch(err => {
        if (!controller.signal.aborted)
          setRoomError(err instanceof Error ? err.message : 'Unable to load rooms.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoaded(true);
      });
    return () => controller.abort();
  }, [revision]);

  function addTracks(items: Track[]) {
    setTracks(previous => [...previous, ...items]);
    if (!activeId && items[0]) setActiveId(items[0].id);
    setError('');
  }
  function addLink(event: FormEvent) {
    event.preventDefault();
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:')
        throw new Error('Use a secure https:// link to an audio file.');
      addTracks([
        {
          id: crypto.randomUUID(),
          title:
            title.trim() || decodeURIComponent(parsed.pathname.split('/').pop() || 'Audio track'),
          src: parsed.href,
          source: 'Audio link',
        },
      ]);
      setUrl('');
      setTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enter a valid audio link.');
    }
  }
  function selectTrack(id: string) {
    continuePlayback.current = playing;
    setPosition(0);
    setDuration(0);
    setActiveId(id);
    setPlaying(false);
    setError('');
  }
  function removeTrack(track: Track) {
    const remaining = tracks.filter(item => item.id !== track.id);
    if (activeId === track.id) {
      audio.current?.pause();
      selectTrack(remaining[0]?.id || '');
    }
    setTracks(remaining);
    if (objectUrls.current.delete(track.src)) URL.revokeObjectURL(track.src);
    if (track.artwork && objectUrls.current.delete(track.artwork))
      URL.revokeObjectURL(track.artwork);
  }

  return (
    <div className="dashboard music-page">
      <Header />
      <div className="dash-shell">
        <Sidebar onCreate={() => setCreate(true)} onJoin={() => setJoin(true)} />
        <main className="dash-main music-main">
          <div className="music-heading">
            <div>
              <h1>Find your rhythm.</h1>
            </div>
            {!code && (
              <button className="dash-button primary" onClick={() => files.current?.click()}>
                <Icon name="plus" />
                Add audio
              </button>
            )}
          </div>
          <input
            ref={files}
            className="visually-hidden"
            type="file"
            accept="audio/*"
            multiple
            aria-label="Choose audio files"
            onChange={event => {
              const chosen = Array.from(event.target.files || []);
              const valid = chosen.filter(
                file =>
                  file.type.startsWith('audio/') ||
                  /\.(mp3|wav|ogg|m4a|aac|flac|opus)$/i.test(file.name)
              );
              addTracks(
                valid.map(file => {
                  const src = URL.createObjectURL(file);
                  objectUrls.current.add(src);
                  const id = crypto.randomUUID();
                  void readAudioDetails(file).then(details => {
                    // The file may have been removed or the page unmounted while parsing.
                    if (!objectUrls.current.has(src)) return;
                    const artwork = details.artwork
                      ? URL.createObjectURL(details.artwork)
                      : undefined;
                    if (artwork) objectUrls.current.add(artwork);
                    setTracks(previous =>
                      previous.map(track =>
                        track.id === id
                          ? {
                              ...track,
                              title: details.title || track.title,
                              artist: details.artist,
                              album: details.album,
                              artwork,
                            }
                          : track
                      )
                    );
                  });
                  return {
                    id,
                    title: file.name.replace(/\.[^.]+$/, ''),
                    src,
                    source: 'Local file',
                  };
                })
              );
              if (valid.length !== chosen.length)
                setError('Some files were skipped. Please choose supported audio files.');
              event.target.value = '';
            }}
          />
          {code && (
            <div className="music-room-banner" role="status">
              <Icon name="people" />
              <span>
                {!loaded
                  ? 'Loading room…'
                  : roomError
                    ? 'Room details are unavailable.'
                    : selectedRoom
                      ? `${selectedRoom.name} · ${selectedRoom.status === 'active' ? `${selectedRoom.member_count} members` : 'Closed room'}`
                      : 'This music room is unavailable or you are not a member.'}
              </span>
              <Link to="/music">All music</Link>
            </div>
          )}
          {code ? (
            <SharedMusic key={code} code={code} />
          ) : (
            <div className="music-workspace">
              <section className="music-player-panel" aria-labelledby="now-playing-title">
                <div className="music-panel-heading">
                  <h2 id="now-playing-title">Now playing</h2>
                  <span className="music-badge">On this device</span>
                </div>
                <div className="music-artwork">
                  {active?.artwork ? (
                    <img
                      key={active.artwork}
                      src={active.artwork}
                      alt={`Album artwork for ${active.album || active.title}`}
                      onError={() =>
                        setTracks(previous =>
                          previous.map(track =>
                            track.id === active.id ? { ...track, artwork: undefined } : track
                          )
                        )
                      }
                    />
                  ) : (
                    <div className="music-artwork-fallback">
                      <Icon name="music" />
                      <span>{active ? 'No album artwork' : 'Your music starts here'}</span>
                    </div>
                  )}
                </div>
                <div className="music-track-info" aria-live="polite">
                  <h3>{active?.title || 'Make room for a little music'}</h3>
                  <p>
                    {active
                      ? [active.artist, active.album].filter(Boolean).join(' · ') || active.source
                      : 'Add your first track to start listening.'}
                  </p>
                </div>
                {active ? (
                  <>
                    <audio
                      key={active.id}
                      ref={audio}
                      className="music-audio-element"
                      preload="metadata"
                      src={active.src}
                      onLoadedMetadata={event => {
                        setDuration(
                          Number.isFinite(event.currentTarget.duration)
                            ? event.currentTarget.duration
                            : 0
                        );
                        event.currentTarget.volume = volume;
                        if (continuePlayback.current) {
                          continuePlayback.current = false;
                          void event.currentTarget
                            .play()
                            .catch(() => setError('Press play to continue listening.'));
                        }
                      }}
                      onTimeUpdate={event => setPosition(event.currentTarget.currentTime)}
                      onPlay={() => setPlaying(true)}
                      onPause={() => setPlaying(false)}
                      onEnded={() => {
                        setPlaying(false);
                        const next = tracks[tracks.findIndex(track => track.id === activeId) + 1];
                        if (next) {
                          selectTrack(next.id);
                          continuePlayback.current = true;
                        }
                      }}
                      onError={() => {
                        setPlaying(false);
                        setError(
                          'This track could not be played. Check the link or try another audio file.'
                        );
                      }}
                    />
                    <div className="music-controls">
                      <div className="music-seek">
                        <span>{timeLabel(position)}</span>
                        <input
                          aria-label="Playback position"
                          type="range"
                          min="0"
                          max={duration || 1}
                          step="0.1"
                          value={Math.min(position, duration || 1)}
                          disabled={!duration}
                          onChange={e => {
                            const value = Number(e.target.value);
                            if (audio.current) audio.current.currentTime = value;
                            setPosition(value);
                          }}
                        />
                        <span>{timeLabel(duration)}</span>
                      </div>
                      <div className="music-transport">
                        <button
                          aria-label="Previous track"
                          disabled={tracks.findIndex(t => t.id === activeId) <= 0}
                          onClick={() =>
                            selectTrack(tracks[tracks.findIndex(t => t.id === activeId) - 1].id)
                          }
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M6 5h2v14H6zm13 0v14L9 12z" />
                          </svg>
                        </button>
                        <button
                          className="music-play-button"
                          aria-label={playing ? 'Pause' : 'Play'}
                          onClick={() => {
                            if (!audio.current) return;
                            if (playing) audio.current.pause();
                            else
                              void audio.current
                                .play()
                                .catch(() =>
                                  setError('Unable to play this track. Check its audio source.')
                                );
                          }}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d={playing ? 'M6 5h4v14H6zm8 0h4v14h-4z' : 'M8 4v16l13-8z'} />
                          </svg>
                        </button>
                        <button
                          aria-label="Next track"
                          disabled={tracks.findIndex(t => t.id === activeId) >= tracks.length - 1}
                          onClick={() =>
                            selectTrack(tracks[tracks.findIndex(t => t.id === activeId) + 1].id)
                          }
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M16 5h2v14h-2zM5 5l10 7-10 7z" />
                          </svg>
                        </button>
                      </div>
                      <div className="music-volume">
                        <button
                          aria-label={volume === 0 ? 'Unmute' : 'Mute'}
                          onClick={() => {
                            const value = volume === 0 ? lastVolume.current : 0;
                            if (volume > 0) lastVolume.current = volume;
                            setVolume(value);
                            if (audio.current) audio.current.volume = value;
                          }}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            aria-hidden="true"
                          >
                            <path d="M3 9h4l5-4v14l-5-4H3z" />
                            {volume ? (
                              <path d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
                            ) : (
                              <path d="m16 9 6 6m0-6-6 6" />
                            )}
                          </svg>
                        </button>
                        <input
                          aria-label="Volume"
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={volume}
                          onChange={e => {
                            const value = Number(e.target.value);
                            setVolume(value);
                            if (audio.current) audio.current.volume = value;
                          }}
                        />
                        <span>{Math.round(volume * 100)}%</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <button className="dash-button" onClick={() => files.current?.click()}>
                    <Icon name="music" />
                    Choose audio files
                  </button>
                )}
                <p className="music-local-note">
                  Only on this device · Files and artwork stay in your browser.
                </p>
              </section>
              <section className="music-queue-panel" aria-labelledby="queue-title">
                <div className="music-panel-heading">
                  <h2 id="queue-title">
                    Your queue <span>{tracks.length}</span>
                  </h2>
                  <span>Session playlist</span>
                </div>
                {tracks.length ? (
                  <ol className="music-queue">
                    {tracks.map((track, index) => (
                      <li key={track.id} className={track.id === activeId ? 'selected' : ''}>
                        <button
                          className="music-track-select"
                          onClick={() => selectTrack(track.id)}
                          aria-current={track.id === activeId ? 'true' : undefined}
                        >
                          <span className="music-track-number">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="music-queue-artwork" aria-hidden="true">
                            {track.artwork ? (
                              <img src={track.artwork} alt="" />
                            ) : (
                              <Icon name="music" />
                            )}
                          </span>
                          <span>
                            <strong>{track.title}</strong>
                            <small>{track.artist || track.source}</small>
                          </span>
                        </button>
                        <button
                          className="music-remove"
                          aria-label={`Remove ${track.title}`}
                          onClick={() => removeTrack(track)}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="music-queue-empty">
                    <Icon name="music" />
                    <h3>A fresh start for your playlist</h3>
                    <p>
                      Add audio files or a direct link below.
                      <br />
                      Only the tracks you choose appear here.
                    </p>
                  </div>
                )}
                <form className="music-add-link" onSubmit={addLink}>
                  <h3>Add an audio link</h3>
                  <label htmlFor="track-title">
                    Track name <span>(optional)</span>
                  </label>
                  <input
                    id="track-title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Give your track a name"
                    maxLength={200}
                  />
                  <label htmlFor="audio-url">Direct audio URL</label>
                  <input
                    id="audio-url"
                    type="url"
                    required
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://example.com/song.mp3"
                    aria-describedby="music-link-help"
                  />
                  <p id="music-link-help">
                    Use a direct audio file link. Spotify and YouTube page links won’t play here.
                  </p>
                  <button className="dash-button" type="submit">
                    <Icon name="plus" />
                    Add to queue
                  </button>
                </form>
              </section>
            </div>
          )}
          {error && (
            <div className="music-error" role="alert">
              {error}
            </div>
          )}
          <section className="music-rooms" aria-labelledby="music-rooms-title">
            <div className="music-panel-heading">
              <div>
                <h2 id="music-rooms-title">Your music rooms</h2>
                <p>A space for your next listening session.</p>
              </div>
              <button className="dash-button" onClick={() => setCreate(true)}>
                <Icon name="plus" />
                New music room
              </button>
            </div>
            {!loaded ? (
              <p role="status">Loading music rooms…</p>
            ) : roomError ? (
              <div role="alert">
                <p>{roomError}</p>
                <button
                  className="dash-button"
                  onClick={() => {
                    setRoomError('');
                    setLoaded(false);
                    setRevision(value => value + 1);
                  }}
                >
                  Retry
                </button>
              </div>
            ) : rooms.length ? (
              <div className="music-room-list">
                {rooms.map(room => (
                  <article key={room.id}>
                    <span className="dash-icon-tile">
                      <Icon name="music" />
                    </span>
                    <div>
                      <h3>{room.name}</h3>
                      <p>
                        {room.member_count} members · {room.status === 'active' ? 'Open' : 'Closed'}
                      </p>
                    </div>
                    {room.status === 'active' && (
                      <Link
                        className="dash-button"
                        to={`/music?room=${encodeURIComponent(room.room_code)}`}
                      >
                        Open
                        <Icon name="arrow" />
                      </Link>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="music-no-rooms">
                <Icon name="people" />
                <div>
                  <h3>No music rooms yet</h3>
                  <p>Create a room or join one with an invitation code.</p>
                </div>
                <button className="dash-button" onClick={() => setJoin(true)}>
                  Join a room
                </button>
              </div>
            )}
          </section>
        </main>
      </div>
      {create && <CreateRoomModal initialType="music" onClose={() => setCreate(false)} />}
      {join && <JoinRoomModal onClose={() => setJoin(false)} />}
    </div>
  );
}
