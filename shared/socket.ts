// Only connection diagnostics are implemented. Room events require real authentication first.
export interface ServerToClientEvents {
  'server:ready': (data: { protocolVersion: 1 }) => void;
  'auth:validated': (data: { ok: true; user: { id: number; name: string; email: string } }) => void;
  'auth:error': (data: { ok: false; error: string }) => void;
  
  // Room events
  'room:joined': (data: { roomId: string; roomCode: string; type: 'video' | 'music' }) => void;
  'room:left': (data: { roomId: string }) => void;
  'room:closed': (data: { roomId: string; reason: string }) => void;
  'room:user_joined': (data: { userId: number; name: string; role: string }) => void;
  'room:user_left': (data: { userId: number; name: string }) => void;
  'room:user_role_changed': (data: { userId: number; role: string }) => void;
  'room:participants': (data: { participants: Array<{ userId: number; name: string; role: string; joinedAt: string }> }) => void;
  
  // Chat events
  'chat:message': (data: { id: number; roomId: string; userId: number; userName: string; body: string; createdAt: string }) => void;
  'chat:history': (data: { messages: Array<{ id: number; userId: number; userName: string; body: string; createdAt: string }>; hasMore: boolean }) => void;
  'chat:typing': (data: { userId: number; userName: string; isTyping: boolean }) => void;
  'chat:unread_count': (data: { roomId: string; count: number }) => void;
  
  // Media queue events
  'queue:updated': (data: { items: Array<{ id: number; mediaId: number; position: number; title: string; type: 'video' | 'music'; url: string; thumbnailUrl?: string; durationSeconds?: number; addedBy: number; addedByName: string; addedAt: string }> }) => void;
  'queue:item_added': (data: { item: { id: number; mediaId: number; position: number; title: string; type: 'video' | 'music'; url: string; thumbnailUrl?: string; durationSeconds?: number; addedBy: number; addedByName: string; addedAt: string } }) => void;
  'queue:item_removed': (data: { itemId: number }) => void;
  'queue:item_moved': (data: { itemId: number; newPosition: number }) => void;
  'queue:cleared': () => void;
  
  // Playback events
  'playback:state': (data: { mediaId: number | null; paused: boolean; positionSeconds: number; revision: number; updatedAt: string }) => void;
  'playback:play': (data: { mediaId: number; positionSeconds: number; revision: number; timestamp: string }) => void;
  'playback:pause': (data: { positionSeconds: number; revision: number; timestamp: string }) => void;
  'playback:seek': (data: { positionSeconds: number; revision: number; timestamp: string }) => void;
  'playback:media_changed': (data: { mediaId: number | null; revision: number; timestamp: string }) => void;
  'playback:sync': (data: { positionSeconds: number; revision: number; serverTime: string }) => void;
  
  // Error events
  'error': (data: { code: string; message: string; details?: unknown }) => void;
}

export interface ClientToServerEvents {
  'health:ping': (reply: (data: { ok: true }) => void) => void;
  'auth:validate': (reply: (data: { ok: true; user: { id: number; name: string; email: string } } | { ok: false; error: string }) => void) => void;
  'auth:logout': (reply: (data: { ok: true }) => void) => void;
  
  // Room events
  'room:join': (data: { roomCode: string }, reply: (data: { ok: true; roomId: string; roomCode: string; type: 'video' | 'music' } | { ok: false; error: string }) => void) => void;
  'room:leave': (data: { roomId: string }, reply: (data: { ok: true } | { ok: false; error: string }) => void) => void;
  'room:get_participants': (data: { roomId: string }, reply: (data: { ok: true; participants: Array<{ userId: number; name: string; role: string; joinedAt: string }> } | { ok: false; error: string }) => void) => void;
  
  // Chat events
  'chat:send': (data: { roomId: string; body: string; clientIdempotencyKey: string }, reply: (data: { ok: true; messageId: number } | { ok: false; error: string }) => void) => void;
  'chat:history': (data: { roomId: string; beforeId?: number; limit?: number }, reply: (data: { ok: true; messages: Array<{ id: number; userId: number; userName: string; body: string; createdAt: string }>; hasMore: boolean } | { ok: false; error: string }) => void) => void;
  'chat:typing': (data: { roomId: string; isTyping: boolean }) => void;
  'chat:mark_read': (data: { roomId: string; upToMessageId: number }, reply: (data: { ok: true } | { ok: false; error: string }) => void) => void;
  
  // Media queue events
  'queue:add': (data: { roomId: string; mediaId: number }, reply: (data: { ok: true; itemId: number } | { ok: false; error: string }) => void) => void;
  'queue:remove': (data: { roomId: string; itemId: number }, reply: (data: { ok: true } | { ok: false; error: string }) => void) => void;
  'queue:reorder': (data: { roomId: string; itemId: number; newPosition: number }, reply: (data: { ok: true } | { ok: false; error: string }) => void) => void;
  'queue:clear': (data: { roomId: string }, reply: (data: { ok: true } | { ok: false; error: string }) => void) => void;
  'queue:get': (data: { roomId: string }, reply: (data: { ok: true; items: Array<{ id: number; mediaId: number; position: number; title: string; type: 'video' | 'music'; url: string; thumbnailUrl?: string; durationSeconds?: number; addedBy: number; addedByName: string; addedAt: string }> } | { ok: false; error: string }) => void) => void;
  
  // Playback events
  'playback:get_state': (data: { roomId: string }, reply: (data: { ok: true; mediaId: number | null; paused: boolean; positionSeconds: number; revision: number; updatedAt: string } | { ok: false; error: string }) => void) => void;
  'playback:play': (data: { roomId: string; mediaId: number; positionSeconds: number; revision: number }, reply: (data: { ok: true; revision: number } | { ok: false; error: string }) => void) => void;
  'playback:pause': (data: { roomId: string; positionSeconds: number; revision: number }, reply: (data: { ok: true; revision: number } | { ok: false; error: string }) => void) => void;
  'playback:seek': (data: { roomId: string; positionSeconds: number; revision: number }, reply: (data: { ok: true; revision: number } | { ok: false; error: string }) => void) => void;
  'playback:change_media': (data: { roomId: string; mediaId: number | null; revision: number }, reply: (data: { ok: true; revision: number } | { ok: false; error: string }) => void) => void;
}