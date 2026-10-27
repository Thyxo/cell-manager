const BASE = import.meta.env.VITE_API_URL || '/api'
const KEY_STORAGE = 'cellManagerApiKey'

// The API key is never baked into the public bundle: the user enters it once
// when the backend asks for it (401), and it is kept in this browser only.
function storedKey() {
  try { return localStorage.getItem(KEY_STORAGE) || '' } catch { return '' }
}

function askForKey() {
  const key = window.prompt('This action needs the API key (ask the admin). It is saved in this browser only.')
  if (!key) return ''
  try { localStorage.setItem(KEY_STORAGE, key.trim()) } catch {}
  return key.trim()
}

async function request(path, options = {}, retried = false) {
  const key = storedKey()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(key ? { 'x-api-key': key } : {}), ...options.headers },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (res.status === 401 && !retried) {
    try { localStorage.removeItem(KEY_STORAGE) } catch {}
    if (askForKey()) return request(path, options, true)
  }
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
  searchDiscordMembers: (query) =>
    request(`/discord/members/search?q=${encodeURIComponent(query)}`),
  getConfig: () => request('/config'),
  updateConfig: (payload) => request('/config', { method: 'PUT', body: payload }),
  lookupDiscordUser: (username) => request(`/discord/lookup?username=${encodeURIComponent(username)}`),
}
