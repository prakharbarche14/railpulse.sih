import { useEffect, useRef, useState } from 'react'
import type { WsPositionUpdate } from '../types'

/**
 * Subscribes to /ws/trains/{trainNumber} and exposes the latest update.
 * Automatically reconnects with backoff if the connection drops — the
 * telemetry simulator broadcasts roughly every 8 seconds.
 */
export function useTrainSocket(trainNumber: string | null) {
  const [lastUpdate, setLastUpdate] = useState<WsPositionUpdate | null>(null)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const retryRef = useRef(0)

  useEffect(() => {
    if (!trainNumber) return
    let cancelled = false
    let socket: WebSocket

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      socket = new WebSocket(`${protocol}://${window.location.host}/ws/trains/${trainNumber}`)
      wsRef.current = socket

      socket.onopen = () => {
        if (cancelled) return
        setConnected(true)
        retryRef.current = 0
      }
      socket.onmessage = (event) => {
        if (cancelled) return
        try {
          const data = JSON.parse(event.data) as WsPositionUpdate
          setLastUpdate(data)
        } catch {
          /* ignore malformed frame */
        }
      }
      socket.onclose = () => {
        if (cancelled) return
        setConnected(false)
        const delay = Math.min(1000 * 2 ** retryRef.current, 10000)
        retryRef.current += 1
        setTimeout(() => {
          if (!cancelled) connect()
        }, delay)
      }
      socket.onerror = () => {
        socket.close()
      }
    }

    connect()

    return () => {
      cancelled = true
      wsRef.current?.close()
    }
  }, [trainNumber])

  return { lastUpdate, connected }
}
