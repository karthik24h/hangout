import { Router } from 'express';
import { pool } from '../config/database';
import { generateRoomCode } from '../utils/roomCode';
const router = Router();

// Create Room
router.post('/api/rooms/create', async (req, res) => {
  const roomCode = generateRoomCode();
  const { name } = req.body;
  try {
    await pool.query('INSERT INTO rooms (room_code, name) VALUES ($1, $2)', [roomCode, name || 'Unnamed Room']);
    res.json({ roomCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating room' });
  }
});

// Join Room
router.get('/api/rooms/join/:code', async (req, res) => {
  const code = req.params.code;
  try {
    const result = await pool.query('SELECT * FROM rooms WHERE room_code = $1', [code]);
    if (result.rows.length > 0) {
      res.json({ room: result.rows[0] });
    } else {
      res.status(404).json({ error: 'Room not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error joining room' });
  }
});

// Close Room
router.delete('/api/rooms/close/:roomCode', async (req, res) => {
  const { roomCode } = req.params;

  try {
    await pool.query('DELETE FROM rooms WHERE room_code = $1', [roomCode]);
    return res.json({ message: 'Room closed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to close room' });
  }
});


export default router;
