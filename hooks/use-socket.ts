"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { io, type Socket } from "socket.io-client"

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || ""

let globalSocket: Socket | null = null

function getSocket(): Socket | null {
  if (!SOCKET_URL) return null

  if (!globalSocket) {
    globalSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      autoConnect: false,
    })
  }
  return globalSocket
}

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    socketRef.current = socket

    if (!socket.connected) {
      socket.connect()
    }

    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)

    if (socket.connected) setIsConnected(true)

    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
    }
  }, [])

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data)
  }, [])

  const joinRoom = useCallback((room: string) => {
    socketRef.current?.emit("join-room", room)
  }, [])

  const leaveRoom = useCallback((room: string) => {
    socketRef.current?.emit("leave-room", room)
  }, [])

  return { socket: socketRef.current, isConnected, emit, joinRoom, leaveRoom }
}

export function useSocketEvent<T = unknown>(event: string, callback: (data: T) => void) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handler = (data: T) => callbackRef.current(data)
    socket.on(event, handler)

    return () => {
      socket.off(event, handler)
    }
  }, [event])
}
