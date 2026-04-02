import { Server as SocketIOServer } from "socket.io"
import type { Server as HTTPServer } from "http"
import { SOCKET_EVENTS } from "./events"

declare global {
  // eslint-disable-next-line no-var
  var io: SocketIOServer | undefined
}

export function initSocketServer(httpServer: HTTPServer): SocketIOServer {
  if (global.io) {
    return global.io
  }

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  })

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id)

    // Join rooms for scoped real-time updates
    socket.on(SOCKET_EVENTS.JOIN_ROOM, (room: string) => {
      socket.join(room)
    })

    socket.on(SOCKET_EVENTS.LEAVE_ROOM, (room: string) => {
      socket.leave(room)
    })

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id)
    })
  })

  global.io = io
  return io
}

// Utility to emit events from API routes
export function emitEvent(event: string, data: unknown, room?: string) {
  if (!global.io) return

  if (room) {
    global.io.to(room).emit(event, data)
  } else {
    global.io.emit(event, data)
  }
}

export function getIO(): SocketIOServer | undefined {
  return global.io
}
