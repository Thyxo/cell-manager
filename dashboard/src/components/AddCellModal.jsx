import React, { useState, useEffect } from 'react'
import { api } from '../lib/api'

const RANKS = ['Ingen', 'Madchemist', 'Legend', 'Titan']

export default function AddCellModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    cellName: '',
    accountName: '',
    rank: '',
    block: '',
    daysLeft: 9,
    discordUser: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lookupStatus, setLookupStatus] = useState('idle') // idle, loading, success, not_found, error
  const [resolvedUser, setResolvedUser] = useState(null)

  useEffect(() => {
    const username = form.discordUser.trim().replace(/^@/, '');
    if (!username) {
      setLookupStatus('idle');
      setResolvedUser(null);
      return;
    }

    setLookupStatus('loading');
    setResolvedUser(null);

    const timer = setTimeout(async () => {
      try {
        const res = await api.lookupDiscordUser(username);
        if (res.found && res.users.length > 0) {
          setLookupStatus('success');
          setResolvedUser(res.users[0]);
        } else {
          setLookupStatus('not_found');
        }
      } catch (err) {
        console.error('Lookup failed', err);
        setLookupStatus('error');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.discordUser]);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit() {
    setError('')
    if (!form.cellName || !form.accountName || !form.rank || !form.block || !form.discordUser) {
      return setError('All fields are required.')
    }
    if (!resolvedUser) {
      return setError('Please enter a valid Discord username that exists in the server.')
    }
    setLoading(true)
    try {
      const payload = {
        ...form,
        discordUser: `<@${resolvedUser.id}>`,
        discordUserId: resolvedUser.id
      }
      await api.createCell(payload)
      onSuccess()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glow)',
        borderRadius: '6px',
        width: '100%', maxWidth: '480px',
        animation: 'fadeIn 0.2s ease',
        overflow: 'hidden',
      }}>
        {/* Modal header */}
        <div style={{
          borderBottom: '1px solid var(--border)',
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontFamily: 'var(--pixel-font)', fontSize: '10px', color: 'var(--accent-green)' }}>
            + ADD CELL
          </h2>
          <button onClick={onClose} style={{
            background: 'none', color: 'var(--text-muted)', fontSize: '18px',
            lineHeight: 1, cursor: 'pointer',
          }}>✕</button>
        </div>

        {/* Avatar preview */}
        {form.accountName && (
          <div style={{
            display: 'flex', justifyContent: 'center', paddingTop: '16px',
            animation: 'fadeIn 0.3s ease',
          }}>
            <img
              src={`https://mc-heads.net/avatar/${form.accountName}`}
              alt="preview"
              width="64" height="64"
              style={{
                border: '2px solid var(--border-glow)',
                borderRadius: '4px',
                imageRendering: 'pixelated',
              }}
            />
          </div>
        )}

        {/* Form */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Row label="Cell Name">
            <Input value={form.cellName} onChange={v => set('cellName', v)} placeholder="e.g. Cell-A" />
          </Row>
          <Row label="MC Username">
            <Input value={form.accountName} onChange={v => set('accountName', v)} placeholder="e.g. Notch" />
          </Row>
          <Row label="Rank">
            <select
              value={form.rank}
              onChange={e => set('rank', e.target.value)}
              style={inputStyle}
            >
              <option value="">Select rank...</option>
              {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Row>
          <Row label="Block">
            <Input value={form.block} onChange={v => set('block', v)} placeholder="C, B, A" />
          </Row>
          <Row label="Days Left">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="range" min="0" max="9" value={form.daysLeft}
                onChange={e => set('daysLeft', Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--accent-green)' }}
              />
              <span style={{ fontFamily: 'var(--pixel-font)', fontSize: '11px', color: 'var(--accent-green)', width: '20px', textAlign: 'center' }}>
                {form.daysLeft}
              </span>
            </div>
          </Row>
          <Row label="Discord Username">
            <div style={{ position: 'relative' }}>
              <Input value={form.discordUser} onChange={v => set('discordUser', v)} placeholder="e.g. username" />
              <div style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                fontSize: '12px'
              }}>
                {lookupStatus === 'loading' && '⏳'}
                {lookupStatus === 'success' && '✅'}
                {lookupStatus === 'not_found' && '❌'}
                {lookupStatus === 'error' && '⚠️'}
              </div>
            </div>
            {resolvedUser && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', padding: '6px', background: 'var(--bg-dark)', borderRadius: '4px' }}>
                <img src={resolvedUser.avatar} alt="avatar" width="20" height="20" style={{ borderRadius: '50%' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{resolvedUser.displayName}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({resolvedUser.id})</span>
              </div>
            )}
          </Row>

          {error && (
            <div style={{
              background: '#ef444422', border: '1px solid #ef444466',
              borderRadius: '3px', padding: '8px 12px',
              color: '#ef4444', fontSize: '13px', fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                flex: 1, padding: '12px',
                background: 'var(--accent-green)', color: '#0a0c0f',
                fontFamily: 'var(--pixel-font)', fontSize: '9px',
                border: 'none', borderRadius: '3px', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s',
              }}
            >
              {loading ? 'ADDING...' : 'ADD CELL'}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '12px 20px',
                background: 'var(--bg-dark)', color: 'var(--text-secondary)',
                border: '1px solid var(--border)', borderRadius: '3px', cursor: 'pointer',
                fontSize: '14px', fontWeight: 700,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', background: 'var(--bg-deepest)',
  border: '1px solid var(--border)', borderRadius: '3px',
  padding: '8px 12px', color: 'var(--text-primary)',
  fontSize: '14px', fontWeight: 500,
  transition: 'border-color 0.15s',
}

function Input({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={inputStyle}
      onFocus={e => e.target.style.borderColor = 'var(--border-glow)'}
      onBlur={e => e.target.style.borderColor = 'var(--border)'}
    />
  )
}

function Row({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
