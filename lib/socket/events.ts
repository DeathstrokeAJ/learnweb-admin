// Socket.io event type definitions

export const SOCKET_EVENTS = {
  // Moderation events
  MODERATION_NEW_TICKET: "moderation:new-ticket",
  MODERATION_TICKET_RESOLVED: "moderation:ticket-resolved",
  MODERATION_STATS_UPDATE: "moderation:stats-update",

  // Notification events
  NOTIFICATION_NEW: "notification:new",

  // Post events
  POST_LIKE_UPDATE: "post:like-update",
  POST_COMMENT_UPDATE: "post:comment-update",
  POST_NEW_COMMENT: "post:new-comment",
  POST_STATUS_CHANGE: "post:status-change",

  // Community events
  COMMUNITY_HEALTH_UPDATE: "community:health-update",
  COMMUNITY_MEMBER_UPDATE: "community:member-update",

  // Admin events
  ADMIN_USER_ROLE_CHANGE: "admin:user-role-change",
  ADMIN_CONFIG_UPDATE: "admin:config-update",

  // Connection events
  JOIN_ROOM: "join-room",
  LEAVE_ROOM: "leave-room",
} as const

export interface SocketEventPayloads {
  [SOCKET_EVENTS.MODERATION_NEW_TICKET]: {
    ticketId: string
    postTitle: string
    priority: string
    aiScore: number
  }
  [SOCKET_EVENTS.MODERATION_TICKET_RESOLVED]: {
    ticketId: string
    action: string
    resolvedBy: string
  }
  [SOCKET_EVENTS.NOTIFICATION_NEW]: {
    id: string
    type: string
    title: string
    message: string
  }
  [SOCKET_EVENTS.POST_LIKE_UPDATE]: {
    postId: string
    likes: number
  }
  [SOCKET_EVENTS.POST_COMMENT_UPDATE]: {
    postId: string
    commentCount: number
  }
  [SOCKET_EVENTS.POST_NEW_COMMENT]: {
    postId: string
    comment: any // Using specific type if importable, or just broad match for now
  }
}
