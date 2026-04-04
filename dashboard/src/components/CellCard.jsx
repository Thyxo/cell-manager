import React, { useState } from 'react'
import { api } from '../lib/api'

const DAY_COLORS = {
  0: '#ef4444',
  1: '#ef4444',
  2: '#f97316',
  3: '#fbbf24',
  4: '#fbbf24',
  5: '#a3e635',
  6: '#4ade80',
  7: '#4ade80',
  8: '#4ade80',
  9: '#4ade80',
}

export default function CellCard({ cell, onRefresh }) {
  const [editing, setEditing] = useState(false)
  const [newDays, setNewDays] = useState(cell.daysLeft)
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const dayColor = DAY_COLORS[cell.daysLeft] || '#4ade80'
  const isUrgent = cell.daysLeft <= 2
  const progress = (cell.daysLeft / 9) * 100

  async function handleUpdateDays() {
    setLoading(true)
    try {
      await api.updateDays(cell.cellName, Number(newDays))
      setEditing(false)
      onRefresh()
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    try {
      await api.deleteCell(cell.cellName)
      onRefresh()
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${isUrgent ? dayColor + '66' : 'var(--border)'}`,
      borderRadius: '4px',
      padding: '0',
      overflow: 'hidden',
      position: 'relative',
      animation: 'fadeIn 0.3s ease',
      boxShadow: isUrgent ? `0 0 20px ${dayColor}22, 0 4px 24px rgba(0,0,0,0.4)` : '0 4px 24px rgba(0,0,0,0.4)',
      transition: 'all 0.2s ease',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = isUrgent ? dayColor + 'aa' : 'var(--border-glow)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = isUrgent ? dayColor + '66' : 'var(--border)'}
    >
      {/* Top color stripe */}
      <div style={{ height: '3px', background: dayColor, width: '100%' }} />

      {/* Progress bar behind header */}
      <div style={{
        position: 'absolute', top: '3px', left: 0,
        height: '60px', width: `${progress}%`,
        background: `linear-gradient(90deg, ${dayColor}18, transparent)`,
        transition: 'width 0.5s ease',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '14px 16px',
        position: 'relative',
      }}>
        {/* Avatar */}
        <div style={{
          width: '48px', height: '48px', flexShrink: 0,
          border: `2px solid ${dayColor}55`,
          borderRadius: '3px', overflow: 'hidden',
          imageRendering: 'pixelated',
        }}>
          <img
            src={`https://mc-heads.net/avatar/${cell.accountName}`}
            alt={cell.accountName}
            width="48" height="48"
            style={{ display: 'block', imageRendering: 'pixelated' }}
            onError={e => { e.target.src = `https://mc-heads.net/avatar/Steve` }}
          />
        </div>

        {/* Name + cell */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--pixel-font)',
            fontSize: '9px',
            color: 'var(--text-primary)',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {cell.accountName}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 600 }}>
            {cell.cellName}
          </div>
        </div>

        {/* Days badge */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          background: dayColor + '22',
          border: `1px solid ${dayColor}55`,
          borderRadius: '3px', padding: '6px 10px',
          flexShrink: 0,
          animation: isUrgent && cell.daysLeft <= 1 ? 'pulse-glow 1.5s infinite' : 'none',
        }}>
          <span style={{ fontFamily: 'var(--pixel-font)', fontSize: '14px', color: dayColor, lineHeight: 1 }}>
            {cell.daysLeft}
          </span>
          <span style={{ fontSize: '10px', color: dayColor + 'aa', marginTop: '3px', fontWeight: 600 }}>
            {cell.daysLeft === 1 ? 'DAY' : 'DAYS'}
          </span>
        </div>
      </div>

      {/* Pixel progress bar */}
      <div style={{ padding: '0 16px', marginBottom: '2px' }}>
        <div style={{ display: 'flex', gap: '2px' }}>
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} style={{
              flex: 1, height: '4px', borderRadius: '1px',
              background: i < cell.daysLeft ? dayColor : 'var(--border)',
              transition: 'background 0.3s ease',
            }} />
          ))}
        </div>
      </div>

      {/* Info rows */}
      <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <InfoRow icon="⭐" label="Rank" value={cell.rank} />
        <InfoRow icon="🧱" label="Block" value={cell.block} />
        <InfoRow icon="👤" label="Notify" value={cell.discordUser} />
      </div>

      {/* Actions */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '10px 16px',
        display: 'flex', gap: '8px',
        background: 'rgba(0,0,0,0.2)',
      }}>
        {editing ? (
          <>
            <input
              type="number" min="0" max="9"
              value={newDays}
              onChange={e => setNewDays(e.target.value)}
              style={{
                flex: 1, background: 'var(--bg-deepest)', border: '1px solid var(--border-glow)',
                borderRadius: '3px', padding: '6px 10px', color: 'var(--text-primary)',
                fontSize: '14px', fontWeight: 700,
              }}
            />
            <ActionBtn onClick={handleUpdateDays} disabled={loading} color="#4ade80">
              {loading ? '...' : '✓ Save'}
            </ActionBtn>
            <ActionBtn onClick={() => setEditing(false)} color="#7fa8b8">
              ✕
            </ActionBtn>
          </>
        ) : confirmDelete ? (
          <>
            <span style={{ flex: 1, fontSize: '13px', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              Delete cell?
            </span>
            <ActionBtn onClick={handleDelete} disabled={loading} color="#ef4444">
              {loading ? '...' : 'Yes'}
            </ActionBtn>
            <ActionBtn onClick={() => setConfirmDelete(false)} color="#7fa8b8">
              No
            </ActionBtn>
          </>
        ) : (
          <>
            <ActionBtn onClick={() => setEditing(true)} color="#38bdf8">
              ✏️ Days
            </ActionBtn>
            <ActionBtn onClick={() => setConfirmDelete(true)} color="#ef444466">
              🗑️
            </ActionBtn>
          </>
        )}
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
      <span style={{ width: '16px', textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{ color: 'var(--text-muted)', fontWeight: 600, width: '46px', flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--text-secondary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </span>
    </div>
  )
}

function ActionBtn({ children, onClick, disabled, color }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: color + '22',
        border: `1px solid ${color}55`,
        color: color,
        borderRadius: '3px',
        padding: '6px 12px',
        fontSize: '13px',
        fontWeight: 700,
        fontFamily: 'var(--body-font)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => { if (!disabled) e.target.style.background = color + '44' }}
      onMouseLeave={e => { if (!disabled) e.target.style.background = color + '22' }}
    >
      {children}
    </button>
  )
}
