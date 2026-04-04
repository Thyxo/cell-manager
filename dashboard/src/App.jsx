import React, { useState, useEffect, useCallback } from 'react'
import { api } from './lib/api'
import { useSocket } from './hooks/useSocket'
import CellCard from './components/CellCard'
import AddCellModal from './components/AddCellModal'
import ConfigPanel from './components/ConfigPanel'

const SORT_OPTIONS = [
  { value: 'days_asc', label: '⏰ Days (urgent first)' },
  { value: 'days_desc', label: '⏰ Days (most first)' },
  { value: 'name', label: '🔤 Account name' },
  { value: 'discord', label: '👤 Discord user' },
]

export default function App() {
  const [cells, setCells] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sort, setSort] = useState('days_asc')
  const [filterExpiring, setFilterExpiring] = useState(false)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [liveIndicator, setLiveIndicator] = useState(false)

  const fetchCells = useCallback(async () => {
    try {
      const data = await api.getCells()
      setCells(data)
      setError('')
    } catch (e) {
      setError('Cannot connect to backend. Is it running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCells() }, [])

  // Live socket updates
  useSocket(useCallback((updatedCells) => {
    setCells(updatedCells)
    setLiveIndicator(true)
    setTimeout(() => setLiveIndicator(false), 1500)
  }, []))

  // Filter + sort
  const processed = cells
    .filter(c => {
      if (filterExpiring && c.daysLeft > 2) return false
      if (search) {
        const q = search.toLowerCase()
        return c.accountName.toLowerCase().includes(q) ||
          c.cellName.toLowerCase().includes(q) ||
          c.discordUser.toLowerCase().includes(q)
      }
      return true
    })
    .sort((a, b) => {
      if (sort === 'days_asc') return a.daysLeft - b.daysLeft
      if (sort === 'days_desc') return b.daysLeft - a.daysLeft
      if (sort === 'name') return a.accountName.localeCompare(b.accountName)
      if (sort === 'discord') return a.discordUser.localeCompare(b.discordUser)
      return 0
    })

  const urgentCount = cells.filter(c => c.daysLeft <= 2).length

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        background: 'rgba(10,12,15,0.95)',
        backdropFilter: 'blur(10px)',
        position: 'sticky', top: 0, zIndex: 100,
        padding: '0 24px',
      }}>
        <div style={{
          maxWidth: '1400px', margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: '16px',
          height: '64px',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <div style={{ fontSize: '24px', lineHeight: 1 }}>⛏️</div>
            <div>
              <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '8px', color: 'var(--accent-green)', letterSpacing: '0.1em' }}>
                CELL MANAGER
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
                Minecraft Account Tracker
              </div>
            </div>
          </div>

          {/* Live indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            marginLeft: '8px',
          }}>
            <div style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: liveIndicator ? '#fbbf24' : '#4ade80',
              boxShadow: liveIndicator ? '0 0 10px #fbbf24' : '0 0 8px #4ade8088',
              transition: 'all 0.3s ease',
            }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
              {liveIndicator ? 'UPDATING' : 'LIVE'}
            </span>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '12px', marginLeft: '4px' }}>
            <Stat label="Total" value={cells.length} color="var(--accent-blue)" />
            {urgentCount > 0 && <Stat label="Urgent" value={urgentCount} color="var(--accent-red)" />}
          </div>

          <div style={{ flex: 1 }} />

          {/* Header actions */}
          <button
            onClick={() => setShowConfig(true)}
            style={{
              background: '#38bdf822', border: '1px solid #38bdf855',
              color: 'var(--accent-blue)', borderRadius: '3px',
              padding: '8px 14px', fontSize: '13px', fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ⚙️ Config
          </button>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              background: 'var(--accent-green)', border: 'none',
              color: '#0a0c0f', borderRadius: '3px',
              padding: '8px 16px',
              fontFamily: 'var(--pixel-font)', fontSize: '8px',
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
          >
            + ADD
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div style={{
        background: 'var(--bg-dark)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 24px',
      }}>
        <div style={{
          maxWidth: '1400px', margin: '0 auto',
          display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '340px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search account, cell, discord..."
              style={{
                width: '100%', background: 'var(--bg-deepest)',
                border: '1px solid var(--border)', borderRadius: '3px',
                padding: '8px 12px 8px 34px', color: 'var(--text-primary)',
                fontSize: '14px', fontWeight: 500,
              }}
            />
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{
              background: 'var(--bg-deepest)', border: '1px solid var(--border)',
              borderRadius: '3px', padding: '8px 12px',
              color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Filter expiring */}
          <button
            onClick={() => setFilterExpiring(f => !f)}
            style={{
              background: filterExpiring ? '#ef444422' : 'var(--bg-deepest)',
              border: `1px solid ${filterExpiring ? '#ef444466' : 'var(--border)'}`,
              color: filterExpiring ? '#ef4444' : 'var(--text-muted)',
              borderRadius: '3px', padding: '8px 14px',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            🔥 Expiring soon
          </button>

          <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {processed.length} / {cells.length} cells
          </span>
        </div>
      </div>

      {/* Main content */}
      <main style={{ flex: 1, padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '12px' }}>
            <div style={{
              width: '20px', height: '20px', border: '2px solid var(--border)',
              borderTopColor: 'var(--accent-green)', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--pixel-font)', fontSize: '8px' }}>LOADING...</span>
          </div>
        )}

        {error && (
          <div style={{
            background: '#ef444415', border: '1px solid #ef444444',
            borderRadius: '4px', padding: '16px 20px',
            color: '#ef4444', fontWeight: 600, fontSize: '14px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && processed.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '280px', gap: '16px',
          }}>
            <div style={{ fontSize: '48px' }}>📦</div>
            <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>
              {cells.length === 0 ? 'NO CELLS YET' : 'NO CELLS MATCH FILTER'}
            </div>
            {cells.length === 0 && (
              <button
                onClick={() => setShowAdd(true)}
                style={{
                  background: 'var(--accent-green)', border: 'none',
                  color: '#0a0c0f', borderRadius: '3px',
                  padding: '10px 20px',
                  fontFamily: 'var(--pixel-font)', fontSize: '8px',
                  cursor: 'pointer',
                }}
              >
                + ADD FIRST CELL
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && processed.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {processed.map((cell, i) => (
              <div key={cell._id} style={{ animationDelay: `${i * 0.04}s` }}>
                <CellCard cell={cell} onRefresh={fetchCells} />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '12px 24px',
        display: 'flex', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--pixel-font)' }}>
          ⛏️ MINECRAFT CELL MANAGER
        </span>
      </footer>

      {showAdd && <AddCellModal onClose={() => setShowAdd(false)} onSuccess={fetchCells} />}
      {showConfig && <ConfigPanel onClose={() => setShowConfig(false)} />}
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      background: color + '15', border: `1px solid ${color}33`,
      borderRadius: '3px', padding: '4px 10px',
    }}>
      <span style={{ fontFamily: 'var(--pixel-font)', fontSize: '11px', color }}>{value}</span>
      <span style={{ fontSize: '11px', color: color + 'aa', fontWeight: 600 }}>{label}</span>
    </div>
  )
}
