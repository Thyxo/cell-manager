const BASE = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  getCells: () => request('/cells'),
  createCell: (payload) => request('/cells', { method: 'POST', body: payload }),
  updateDays: (cellName, daysLeft) =>
    request(`/cells/${encodeURIComponent(cellName)}/days`, { method: 'PATCH', body: { daysLeft } }),
  updateCell: (cellName, payload) =>
    request(`/cells/${encodeURIComponent(cellName)}`, { method: 'PUT', body: payload }),
  deleteCell: (cellName) =>
    request(`/cells/${encodeURIComponent(cellName)}`, { method: 'DELETE' }),
  getConfig: () => request('/config'),
  updateConfig: (payload) => request('/config', { method: 'PUT', body: payload }),
}
