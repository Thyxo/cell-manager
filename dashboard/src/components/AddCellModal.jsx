import React, { useEffect, useState } from 'react'
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
    discordUserId: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [discordQuery, setDiscordQuery] = useState('')
  const [discordResults, setDiscordResults] = useState([])
  const [discordLoading, setDiscordLoading] = useState(false)
  const [discordError, setDiscordError] = useState('')

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  useEffect(() => {
    const query = discordQuery.trim()
    setDiscordError('')

    if (form.discordUserId || query.length < 2) {
      setDiscordResults([])
      setDiscordLoading(false)
      return
    }

    setDiscordLoading(true)
    const timeout = setTimeout(async () => {
      try {
        const results = await api.searchDiscordMembers(query)
        setDiscordResults(results)
      } catch (e) {
        setDiscordResults([])
        setDiscordError(e.message)
      } finally {
        setDiscordLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [discordQuery, form.discordUserId])

  function handleDiscordChange(value) {
    setDiscordQuery(value)
    set('discordUser', '')
    set('discordUserId', '')
  }

  function selectDiscordMember(member) {
    const label = member.displayName || member.globalName || member.username
    setDiscordQuery(label)
    setDiscordResults([])
    setForm(f => ({
      ...f,
      discordUser: member.mention,
      discordUserId: member.id,
    }))
  }

  async function handleSubmit() {
    setError('')
    if (!form.cellName || !form.accountName || !form.rank || !form.block) {
      return setError('All fields are required.')
    }
    if (!form.discordUserId) {
      return setError('Please select a Discord user from the server list.')
    }
    setLoading(true)
    try {
      await api.createCell(form)
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
          <Row label="Discord @">
            <div style={{ position: 'relative' }}>
              <Input value={discordQuery} onChange={handleDiscordChange} placeholder="Search server member..." />
              {discordLoading && (
                <div style={{ position: 'absolute', right: '10px', top: '8px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 700 }}>
                  ...
                </div>
              )}
              {discordResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 5,
                  background: 'var(--bg-deepest)', border: '1px solid var(--border-glow)',
                  borderRadius: '3px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                }}>
                  {discordResults.map(member => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => selectDiscordMember(member)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 10px', background: 'transparent', color: 'var(--text-primary)',
                        borderBottom: '1px solid var(--border)', textAlign: 'left',
                      }}
                    >
                      {member.avatar ? (
                        <img src={member.avatar} alt="" width="28" height="28" style={{ borderRadius: '3px' }} />
                      ) : (
                        <div style={{ width: '28px', height: '28px', borderRadius: '3px', background: 'var(--border)' }} />
                      )}
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {member.displayName}
                        </span>
                        <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px' }}>
                          @{member.username}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {form.discordUserId && (
              <div style={{ color: 'var(--accent-green)', fontSize: '12px', fontWeight: 700, marginTop: '5px' }}>
                Selected {form.discordUser}
              </div>
            )}
            {discordError && (
              <div style={{ color: 'var(--accent-red)', fontSize: '12px', fontWeight: 700, marginTop: '5px' }}>
                {discordError}
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
