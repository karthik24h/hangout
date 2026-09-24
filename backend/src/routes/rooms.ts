import { Router } from 'express';
import { pool } from '../config/database';
import { generateRoomCode } from '../utils/roomCode';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Create Room
router.post('/api/rooms/create', requireAuth, async (req, res) => {
  const roomCode = generateRoomCode();
  const { name, type = 'video', password, privacy = 'public' } = req.body;
  
  if (!['video', 'music'].includes(type)) {
    return res.status(400).json({ error: 'Invalid room type' });
  }
  if (!['public', 'private', 'invite_only'].includes(privacy)) {
    return res.status(400).json({ error: 'Invalid privacy setting' });
  }

  let passwordHash: string | null = null;
  if (password) {
    const bcrypt = await import('bcrypt');
    passwordHash = await bcrypt.hash(password, 10);
  }

  try {
    const result = await pool.query(
      `INSERT INTO rooms (room_code, name, type, host_id, password_hash, privacy) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, room_code, name, type, privacy, status, created_at`,
      [roomCode, name || 'Unnamed Room', type, req.user!.id, passwordHash, privacy]
    );

    const room = result.rows[0];
    
    // Add host as member
    await pool.query(
      `INSERT INTO room_members (room_id, user_id, role) VALUES ($1, $2, 'host')`,
      [room.id, req.user!.id]
    );

    res.status(201).json({ room: { ...room, memberCount: 1 } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating room' });
  }
});

// List user's rooms
router.get('/api/rooms', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.room_code, r.name, r.type, r.privacy, r.status, r.created_at,
              (SELECT COUNT(*) FROM room_members rm WHERE rm.room_id = r.id AND rm.left_at IS NULL) as member_count
       FROM rooms r
       JOIN room_members rm ON rm.room_id = r.id
       WHERE rm.user_id = $1 AND rm.left_at IS NULL
       ORDER BY r.created_at DESC`,
      [req.user!.id]
    );
    res.json({ rooms: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching rooms' });
  }
});

// Join Room
router.post('/api/rooms/join/:code', requireAuth, async (req, res) => {
  const code = req.params.code;
  const { password } = req.body;

  try {
    const roomResult = await pool.query(
      `SELECT * FROM rooms WHERE room_code = $1`,
      [code]
    );

    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const room = roomResult.rows[0];

    if (room.status !== 'active') {
      return res.status(400).json({ error: 'Room is not active' });
    }

    // Check if already a member
    const memberResult = await pool.query(
      `SELECT * FROM room_members WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL`,
      [room.id, req.user!.id]
    );

    if (memberResult.rows.length > 0) {
      return res.json({ room: { ...room, memberCount: 1 } });
    }

    // Check password for private rooms
    if (room.privacy === 'private' && room.password_hash) {
      if (!password) {
        return res.status(401).json({ error: 'Password required', requiresPassword: true });
      }
      const bcrypt = await import('bcrypt');
      const valid = await bcrypt.compare(password, room.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    // Add as member
    await pool.query(
      `INSERT INTO room_members (room_id, user_id, role) VALUES ($1, $2, 'member')`,
      [room.id, req.user!.id]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM room_members WHERE room_id = $1 AND left_at IS NULL`,
      [room.id]
    );

    res.json({ room: { ...room, memberCount: parseInt(countResult.rows[0].count) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error joining room' });
  }
});

// Get room details
router.get('/api/rooms/:roomCode', requireAuth, async (req, res) => {
  const code = req.params.roomCode;

  try {
    const roomResult = await pool.query(
      `SELECT r.*, 
              (SELECT COUNT(*) FROM room_members rm WHERE rm.room_id = r.id AND rm.left_at IS NULL) as member_count
       FROM rooms r WHERE r.room_code = $1`,
      [code]
    );

    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const room = roomResult.rows[0];

    // Check membership
    const memberResult = await pool.query(
      `SELECT role FROM room_members WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL`,
      [room.id, req.user!.id]
    );

    if (memberResult.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this room' });
    }

    res.json({ room: { ...room, userRole: memberResult.rows[0].role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching room' });
  }
});

// Leave Room
router.post('/api/rooms/:roomCode/leave', async (req, res) => {
  const code = req.params.roomCode;

  try {
    const roomResult = await pool.query(`SELECT id FROM rooms WHERE room_code = $1`, [code]);
    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const roomId = roomResult.rows[0].id;

    await pool.query(
      `UPDATE room_members SET left_at = NOW() WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL`,
      [roomId, req.user!.id]
    );

    res.json({ message: 'Left room successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error leaving room' });
  }
});

// Close Room (host only)
router.delete('/api/rooms/:roomCode', async (req, res) => {
  const code = req.params.roomCode;

  try {
    const roomResult = await pool.query(`SELECT id, host_id FROM rooms WHERE room_code = $1`, [code]);
    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const room = roomResult.rows[0];
    if (room.host_id !== req.user!.id) {
      return res.status(403).json({ error: 'Only the host can close the room' });
    }

    await pool.query(
      `UPDATE rooms SET status = 'closed', closed_at = NOW() WHERE id = $1`,
      [room.id]
    );

    await pool.query(
      `UPDATE room_members SET left_at = NOW() WHERE room_id = $1 AND left_at IS NULL`,
      [room.id]
    );

    res.json({ message: 'Room closed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to close room' });
  }
});

// Remove member (host only)
router.delete('/api/rooms/:roomCode/members/:userId', async (req, res) => {
  const code = req.params.roomCode;
  const targetUserId = parseInt(req.params.userId, 10);

  try {
    const roomResult = await pool.query(`SELECT id, host_id FROM rooms WHERE room_code = $1`, [code]);
    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const room = roomResult.rows[0];
    if (room.host_id !== req.user!.id) {
      return res.status(403).json({ error: 'Only the host can remove members' });
    }

    if (targetUserId === room.host_id) {
      return res.status(400).json({ error: 'Cannot remove the host' });
    }

    await pool.query(
      `UPDATE room_members SET left_at = NOW() WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL`,
      [room.id, targetUserId]
    );

    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

export default router;