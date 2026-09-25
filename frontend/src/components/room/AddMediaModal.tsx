import { useState, type FormEvent } from 'react';

type Media = { title: string; url: string };

type Props = {
  onClose: () => void;
  onAdd: (media: Media) => void;
};

export default function AddMediaModal({ onClose, onAdd }: Props) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmedUrl = url.trim();

    try {
      const parsedUrl = new URL(trimmedUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error();
      onAdd({ title: title.trim() || 'Shared video', url: parsedUrl.toString() });
      onClose();
    } catch {
      setError('Enter a valid direct video link, for example an MP4 or WebM URL.');
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-media-title">
      <div className="modal">
        <div className="modal-header">
          <h2 id="add-media-title" className="modal-title">Add video link</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          <form onSubmit={submit}>
            <div className="form-group mb-4">
              <label htmlFor="mediaUrl" className="form-label">Direct video URL</label>
              <input
                id="mediaUrl"
                className="form-input"
                type="url"
                required
                autoFocus
                placeholder="https://example.com/video.mp4"
                value={url}
                onChange={event => { setUrl(event.target.value); setError(''); }}
              />
              <small className="form-help">Use a direct .mp4, .webm, or browser-compatible video URL. YouTube page links cannot play directly.</small>
            </div>
            <div className="form-group mb-4">
              <label htmlFor="mediaTitle" className="form-label">Title <span>(optional)</span></label>
              <input
                id="mediaTitle"
                className="form-input"
                placeholder="Tonight's watch"
                value={title}
                onChange={event => setTitle(event.target.value)}
              />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">Add video</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
