import { useState, type FormEvent } from 'react';

type Media = { title: string; url: string };

export default function AddMediaModal({ onClose, onAdd }: { onClose: () => void; onAdd: (media: Media) => void }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    if (file) {
      onAdd({ title: title.trim() || file.name.replace(/\.[^.]+$/, ''), url: URL.createObjectURL(file) });
      onClose();
      return;
    }
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Use a valid http:// or https:// video URL.');
      onAdd({ title: title.trim() || decodeURIComponent(parsed.pathname.split('/').pop() || 'Shared video'), url: parsed.href });
      onClose();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Choose a video file or enter a valid URL.'); }
  }

  return <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-media-title"><div className="modal"><div className="modal-header"><h2 id="add-media-title" className="modal-title">Add video</h2><button className="modal-close" onClick={onClose} aria-label="Close">×</button></div><div className="modal-body"><form onSubmit={submit}><div className="form-group mb-4"><label htmlFor="mediaFile" className="form-label">Video file</label><input id="mediaFile" className="form-input" type="file" accept="video/*" onChange={event => { setFile(event.target.files?.[0] || null); setUrl(''); setError(''); }} /></div><div className="media-divider"><span>or use a direct link</span></div><div className="form-group mb-4"><label htmlFor="mediaTitle" className="form-label">Title <span>(optional)</span></label><input id="mediaTitle" className="form-input" placeholder="Tonight's watch" value={title} onChange={event => setTitle(event.target.value)} /></div><div className="form-group mb-4"><label htmlFor="mediaUrl" className="form-label">Direct video URL</label><input id="mediaUrl" className="form-input" placeholder="https://example.com/video.mp4" value={url} onChange={event => { setUrl(event.target.value); setFile(null); setError(''); }} /></div>{error && <p className="form-error">{error}</p>}<div className="flex gap-2 justify-end"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary">Add video</button></div></form></div></div></div>;
}
