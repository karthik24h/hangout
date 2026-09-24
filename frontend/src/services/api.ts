const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

// Returns the response so each existing screen retains its own error presentation.
export function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${apiUrl}${path}`, options);
}
