import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createSocket } from '../../socket/client';
import { musicPosition, type MusicCommand, type MusicReply } from '../../../../shared/music';

export default function SharedMusic({ code }: { code: string }) {
  const [snapshot, setSnapshot] = useState<Extract<MusicReply, { ok: true }> | null>(null);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [pending, setPending] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [volume, setVolume] = useState(1);
  const player = useRef<HTMLAudioElement>(null);
  const socket = useRef<ReturnType<typeof createSocket> | null>(null);
  const busy = useRef(false);
  const sync = useRef<{
    value: Extract<MusicReply, { ok: true }>;
    received: number;
    latency: number;
  } | null>(null);
  const enabledRef = useRef(false);
  const active = snapshot?.state.tracks.find(track => track.id === snapshot.state.activeId);

  useEffect(() => {
    const client = createSocket();
    socket.current = client;
    let cancelled = false;
    const request = () => {
      if (!client.connected || busy.current) return;
      busy.current = true;
      const sent = performance.now();
      client.timeout(4000).emit('music:request', { code }, (err, reply) => {
        if (cancelled) return;
        busy.current = false;
        if (err || !reply?.ok) {
          setError(
            err
              ? 'Connection interrupted. Reconnecting…'
              : reply && !reply.ok
                ? reply.error
                : 'Unable to synchronize.'
          );
          player.current?.pause();
          sync.current = null;
          setConnected(false);
          return;
        }
        sync.current = {
          value: reply,
          received: performance.now(),
          latency: (performance.now() - sent) / 2,
        };
        setSnapshot(reply);
        setConnected(true);
      });
    };
    client.on('connect', () => {
      setError('');
      request();
    });
    const offline = () => {
      setConnected(false);
      sync.current = null;
      player.current?.pause();
    };
    client.on('disconnect', offline);
    client.on('connect_error', offline);
    client.connect();
    // Each snapshot revalidates both the session and membership, even after revocation.
    const timer = window.setInterval(request, 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
      client.disconnect();
      socket.current = null;
      busy.current = false;
      sync.current = null;
      player.current?.pause();
    };
  }, [code]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = sync.current;
      const audio = player.current;
      if (!current || !audio || audio.readyState < 1 || !enabledRef.current) return;
      const target = Math.min(
        Number.isFinite(audio.duration) ? audio.duration : Infinity,
        musicPosition(
          current.value.state,
          current.value.serverTime + current.latency + performance.now() - current.received
        )
      );
      if (Math.abs(audio.currentTime - target) > 0.4) audio.currentTime = target;
      if (current.value.state.paused) audio.pause();
      else if (audio.paused && !audio.ended)
        void audio.play().catch(() => {
          enabledRef.current = false;
          setEnabled(false);
          setError('Click Join audio to allow playback in this browser.');
        });
      setPosition(audio.currentTime);
    }, 250);
    return () => clearInterval(timer);
  }, []);

  async function command(value: MusicCommand) {
    const client = socket.current;
    if (!client?.connected || !snapshot || busy.current) {
      setError('Still synchronizing. Please try again in a moment.');
      return;
    }
    busy.current = true;
    setPending(true);
    setError('');
    const sent = performance.now();
    client
      .timeout(4000)
      .emit(
        'music:request',
        { code, command: value, revision: snapshot.state.revision },
        (err, reply) => {
          busy.current = false;
          setPending(false);
          if (err || !reply?.ok) {
            setError(
              err
                ? 'No confirmation received. Check the queue before retrying.'
                : reply && !reply.ok
                  ? reply.error
                  : 'Unable to synchronize.'
            );
            return;
          }
          sync.current = {
            value: reply,
            received: performance.now(),
            latency: (performance.now() - sent) / 2,
          };
          setSnapshot(reply);
          if (value.type === 'add') {
            setTitle('');
            setUrl('');
          }
        }
      );
  }
  const joinAudio = async () => {
    if (!player.current) return;
    setError('');
    enabledRef.current = true;
    setEnabled(true);
    try {
      await player.current.play();
      if (snapshot?.state.paused) player.current.pause();
    } catch {
      enabledRef.current = false;
      setEnabled(false);
      setError('Audio could not start. Check the audio link and try again.');
    }
  };
  const add = (event: FormEvent) => {
    event.preventDefault();
    void command({ type: 'add', title, url });
  };
  return (
    <section className="music-rooms shared-music" aria-label="Shared room player">
      <div className="music-panel-heading">
        <h2>Listening together</h2>
        <span className="music-badge">
          {connected ? (snapshot?.host ? 'You are the host' : 'Following the host') : 'Connecting…'}
        </span>
      </div>
      <p className="music-local-note">
        The host controls the shared queue. Click Join audio to hear the room on this device.
      </p>
      {error && (
        <p className="music-error" role="alert">
          {error}
        </p>
      )}
      <div className="music-workspace">
        <div className="music-player-panel">
          <h3>{active?.title || 'No track selected'}</h3>
          {active ? (
            <>
              <audio
                key={active.id}
                ref={player}
                src={active.url}
                preload="metadata"
                onLoadedMetadata={e => {
                  setDuration(
                    Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0
                  );
                  e.currentTarget.volume = volume;
                }}
                onEnded={() => {
                  if (snapshot?.host)
                    void command({ type: 'pause', position: player.current?.duration || 0 });
                }}
                onError={() => {
                  setError(
                    'The shared track could not load. The host should check its public audio URL.'
                  );
                  enabledRef.current = false;
                  setEnabled(false);
                }}
              />
              <button
                className="dash-button primary"
                disabled={!connected}
                onClick={() => {
                  if (enabled) {
                    enabledRef.current = false;
                    setEnabled(false);
                    player.current?.pause();
                  } else void joinAudio();
                }}
              >
                {enabled ? 'Leave audio' : 'Join audio'}
              </button>
              <p>
                {snapshot?.state.paused ? 'Paused' : 'Playing'} · {Math.floor(position / 60)}:
                {String(Math.floor(position % 60)).padStart(2, '0')}
              </p>
              <label>
                Volume
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
                    if (player.current) player.current.volume = value;
                  }}
                />
              </label>
              {snapshot?.host && (
                <div>
                  <button
                    className="dash-button"
                    disabled={pending || !connected}
                    onClick={() =>
                      void command({
                        type: snapshot.state.paused ? 'play' : 'pause',
                        position: musicPosition(
                          snapshot.state,
                          (sync.current?.value.serverTime || Date.now()) +
                            performance.now() -
                            (sync.current?.received || performance.now())
                        ),
                      })
                    }
                  >
                    {snapshot.state.paused ? 'Play for everyone' : 'Pause for everyone'}
                  </button>
                  <label>
                    Seek to (seconds)
                    <input
                      aria-label="Seek to seconds"
                      type="number"
                      min="0"
                      max={duration || 86400}
                      defaultValue="0"
                      id="shared-seek"
                    />
                  </label>
                  <button
                    className="dash-button"
                    disabled={pending || !connected}
                    onClick={() => {
                      const input = document.getElementById('shared-seek') as HTMLInputElement;
                      if (input.checkValidity())
                        void command({ type: 'seek', position: Number(input.value) });
                    }}
                  >
                    Seek for everyone
                  </button>
                </div>
              )}
            </>
          ) : (
            <p>The host can add a public HTTPS audio link to begin.</p>
          )}
        </div>
        <div className="music-queue-panel">
          <h3>Shared queue · {snapshot?.state.tracks.length || 0}</h3>
          <ol className="music-queue">
            {snapshot?.state.tracks.map(track => (
              <li key={track.id} className={active?.id === track.id ? 'selected' : ''}>
                <span className="music-track-select">{track.title}</span>
                {snapshot.host && (
                  <>
                    <button
                      className="dash-button"
                      disabled={pending || !connected}
                      onClick={() => void command({ type: 'select', id: track.id })}
                    >
                      Select
                    </button>
                    <button
                      className="music-remove"
                      aria-label={`Remove ${track.title}`}
                      disabled={pending || !connected}
                      onClick={() => void command({ type: 'remove', id: track.id })}
                    >
                      ×
                    </button>
                  </>
                )}
              </li>
            ))}
          </ol>
          {snapshot?.host && (
            <form className="music-add-link" onSubmit={add}>
              <label htmlFor="shared-title">Track name</label>
              <input
                id="shared-title"
                required
                maxLength={200}
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              <label htmlFor="shared-url">Public HTTPS audio URL</label>
              <input
                id="shared-url"
                type="url"
                required
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
              <p>
                Use a direct audio file accessible to everyone. Device files and Spotify/YouTube
                page links cannot be shared here.
              </p>
              <button className="dash-button" disabled={pending || !connected}>
                Add shared track
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
