import React, { useState, useEffect } from 'react'
import { api } from '../lib/api'

export default function ConfigPanel({ onClose }) {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.getConfig().then(c => { setConfig(c); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await api.updateConfig(config)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glow)',
        borderRadius: '6px',
        width: '100%', maxWidth: '420px',
        animation: 'fadeIn 0.2s ease',
        overflow: 'hidden',
      }}>
        <div style={{ borderBottom: '1px solid var(--border)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: 'var(--pixel-font)', fontSize: '9px', color: 'var(--accent-blue)' }}>⚙️ BOT CONFIG</h2>
          <button onClick={onClose} style={{ background: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <ConfigRow label="Notification Threshold (days)">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="range" min="1" max="9"
                value={config.notificationThreshold}
                onChange={e => setConfig(c => ({ ...c, notificationThreshold: Number(e.target.value) }))}
                style={{ flex: 1, accentColor: 'var(--accent-blue)' }}
              />
              <span style={{ fontFamily: 'var(--pixel-font)', fontSize: '12px', color: 'var(--accent-blue)', width: '20px' }}>
                {config.notificationThreshold}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Notify when days left ≤ this value
            </p>
          </ConfigRow>

          <ConfigRow label="Notification Mode">
            <div style={{ display: 'flex', gap: '8px' }}>
              {['dm', 'channel'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setConfig(c => ({ ...c, notificationMode: mode }))}
                  style={{
                    flex: 1, padding: '8px',
                    background: config.notificationMode === mode ? '#38bdf822' : 'var(--bg-deepest)',
                    border: `1px solid ${config.notificationMode === mode ? 'var(--accent-blue)' : 'var(--border)'}`,
                    color: config.notificationMode === mode ? 'var(--accent-blue)' : 'var(--text-muted)',
                    borderRadius: '3px', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}
                >
                  {mode === 'dm' ? '💬 DM' : '📢 Channel'}
                </button>
              ))}
            </div>
          </ConfigRow>

          {config.notificationMode === 'channel' && (
            <ConfigRow label="Channel ID">
              <input
                value={config.notificationChannelId}
                onChange={e => setConfig(c => ({ ...c, notificationChannelId: e.target.value }))}
                placeholder="Discord channel ID"
                style={{
                  width: '100%', background: 'var(--bg-deepest)',
                  border: '1px solid var(--border)', borderRadius: '3px',
                  padding: '8px 12px', color: 'var(--text-primary)', fontSize: '14px',
                }}
              />
            </ConfigRow>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '12px',
              background: saved ? '#4ade80' : 'var(--accent-blue)',
              color: '#0a0c0f',
              fontFamily: 'var(--pixel-font)', fontSize: '9px',
              border: 'none', borderRadius: '3px', cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1, transition: 'all 0.2s',
            }}
          >
            {saved ? '✓ SAVED!' : saving ? 'SAVING...' : 'SAVE CONFIG'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfigRow({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
