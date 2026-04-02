import { NextResponse } from "next/server"

// Socket.io runs as a separate process or attaches to the HTTP server.
// In a Next.js environment, Socket.io is initialized in a custom server.
// This route serves as a health check for Socket.io connectivity.

export async function GET() {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL

  return NextResponse.json({
    socketConfigured: !!socketUrl,
    socketUrl: socketUrl || null,
    message: socketUrl
      ? "Socket.io server is configured"
      : "Socket.io not configured. Set NEXT_PUBLIC_SOCKET_URL to enable real-time features.",
  })
}
