const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

async function request(path, options) {
  let res;
  try {
    res = await fetch(`${API}${path}`, options);
  } catch {
    throw new Error(`Cannot reach the server at ${API}. Make sure the backend is running.`);
  }
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) throw new Error(body?.error || `Request failed (${res.status}).`);
  return body;
}

export const getAnalytics = () => request('/api/analytics');
export const getTransactions = () => request('/api/transactions');
export const uploadFile = (file) => {
  const form = new FormData();
  form.append('file', file);
  return request('/api/upload', { method: 'POST', body: form });
};
export const SAMPLE_URL = `${API}/api/sample`;
