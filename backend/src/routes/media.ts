import { Router, type Request } from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import { pool } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();
const storageRoot = path.resolve(process.env.MEDIA_STORAGE_DIR || './storage/media');
const incomingDir = path.join(storageRoot, 'incoming');
const processedDir = path.join(storageRoot, 'processed');
const upload = multer({ dest: incomingDir, limits: { fileSize: 5 * 1024 * 1024 * 1024 }, fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith('video/')) });

function transcode(input: string, output: string) {
  return new Promise<void>((resolve, reject) => {
    if (!ffmpegPath) return reject(new Error('FFmpeg is unavailable'));
    const child = spawn(ffmpegPath, ['-y', '-i', input, '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', output]);
    let error = '';
    child.stderr.on('data', chunk => { error += String(chunk); });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error(error.slice(-500))));
  });
}

router.post('/api/rooms/:roomCode/media', requireAuth, upload.single('video'), async (req, res, next) => {
  let input = '';
  try {
    if (!req.file) return res.status(400).json({ error: 'A video file is required.' });
    input = req.file.path;
    const userId = (req as Request & { user?: { id: number } }).user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required.' });
    const room = await pool.query('SELECT id FROM rooms WHERE room_code = $1 AND status = $2', [req.params.roomCode, 'active']);
    if (!room.rows[0]) return res.status(404).json({ error: 'Room not found.' });
    const member = await pool.query('SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL', [room.rows[0].id, userId]);
    if (!member.rows[0]) return res.status(403).json({ error: 'You are not a member of this room.' });
    await fs.mkdir(processedDir, { recursive: true });
    const filename = `${randomUUID()}.mp4`;
    const output = path.join(processedDir, filename);
    await transcode(input, output);
    const result = await pool.query('INSERT INTO media_items (url, type, title, creator_id) VALUES ($1, $2, $3, $4) RETURNING id, url, title, type', [`/api/media/${filename}`, 'video', req.body.title || req.file.originalname, userId]);
    await fs.rm(input, { force: true });
    res.status(201).json({ media: result.rows[0] });
  } catch (error) { if (input) await fs.rm(input, { force: true }).catch(() => undefined); next(error); }
});

router.get('/api/media/:filename', requireAuth, async (req, res, next) => {
  try { const filename = path.basename(String(req.params.filename)); res.sendFile(path.join(processedDir, filename)); } catch (error) { next(error); }
});

export default router;
