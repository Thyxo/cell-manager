import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || ''

export function useSocket(onCellsUpdated) {
  const socketRef = useRef(null)

  useEffect(() => {
    const socket = io(SOCKET_URL, { path: '/socket.io' })
    socketRef.current = socket

    socket.on('connect', () => console.log('🔗 Dashboard socket connected'))
    socket.on('cells:updated', onCellsUpdated)
    socket.on('disconnect', () => console.log('Socket disconnected'))

    return () => {
      socket.off('cells:updated', onCellsUpdated)
      socket.disconnect()
    }
  }, [])

  return socketRef.current
}
