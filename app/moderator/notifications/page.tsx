"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCircle2, Circle, Clock, Trash2 } from "lucide-react"
import { api } from "@/lib/api-client"
import { formatDistanceToNow } from "date-fns"

export default function ModeratorNotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        fetchNotifications()
    }, [])

    async function fetchNotifications() {
        try {
            setLoading(true)
            const response: any = await api.get("/api/notifications")
            // Handle the standardized data access pattern (response might be {notifications, unreadCount})
            if (response && response.notifications) {
                setNotifications(response.notifications)
                setUnreadCount(response.unreadCount)
            } else {
                setNotifications(Array.isArray(response) ? response : [])
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error)
        } finally {
            setLoading(false)
        }
    }

    const markAsRead = async (id: string) => {
        try {
            await api.patch("/api/notifications", { notificationId: id })
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error("Failed to mark as read:", error)
        }
    }

    const markAllRead = async () => {
        try {
            await api.patch("/api/notifications", { markAllRead: true })
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error("Failed to mark all as read:", error)
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
                    <p className="text-sm text-muted-foreground">Keep track of moderation alerts and system updates</p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Mark all as read
                    </Button>
                )}
            </div>

            <div className="flex flex-col gap-3">
                {loading ? (
                    <div className="flex flex-col gap-3">
                        {[1, 2, 3].map(i => (
                            <Card key={i} className="animate-pulse">
                                <CardContent className="h-20" />
                            </Card>
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-muted p-4 mb-4">
                                <Bell className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium">No notifications yet</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                When you have new moderation alerts or system updates, they will appear here.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    notifications.map((notification) => (
                        <Card
                            key={notification._id}
                            className={`transition-colors ${!notification.isRead ? "bg-primary/5 border-primary/20" : ""}`}
                        >
                            <CardContent className="flex items-start gap-4 p-4">
                                <div className={`mt-1 rounded-full p-2 ${!notification.isRead ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                                    <Bell className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <h4 className={`text-sm font-semibold truncate ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                                            {notification.title}
                                        </h4>
                                        {!notification.isRead && (
                                            <Badge variant="default" className="text-[10px] h-4 px-1.5 bg-primary">New</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                        {notification.message}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </span>
                                        {!notification.isRead && (
                                            <button
                                                onClick={() => markAsRead(notification._id)}
                                                className="text-primary hover:underline font-medium"
                                            >
                                                Mark as read
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
