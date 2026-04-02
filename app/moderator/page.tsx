"use client"

import { useEffect, useState } from "react"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ListChecks,
  AlertTriangle,
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Activity,
  ArrowUpRight,
} from "lucide-react"
import Link from "next/link"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { api } from "@/lib/api-client"

export default function ModeratorDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])

  async function fetchDashboardData() {
    try {
      const [statsRes, activityRes] = await Promise.all([
        api.get("/api/moderator/overview"),
        api.get("/api/moderator/activity")
      ])
      setData(statsRes)
      setActivities(Array.isArray(activityRes) ? activityRes : [])
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 10000) // Poll every 10s
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>
  }
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Moderator Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time overview of platform moderation activity</p>
        </div>
        <Link href="/moderator/queue">
          <Button className="gap-2">
            <ListChecks className="h-4 w-4" />
            Open Queue
          </Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Tickets"
          value={data?.totalPending || 0}
          icon={Clock}
          description="Awaiting review"
        />
        <StatCard
          title="Critical Alerts"
          value={data?.criticalPending || 0}
          icon={AlertTriangle}
          description="High severity"
          className="border-destructive/20"
        />
        <StatCard
          title="Resolved Today"
          value={data?.resolvedToday || 0}
          icon={CheckCircle2}
          description="Last 24 hours"
        />
        <StatCard
          title="Total Actions"
          value={data?.totalTickets || 0}
          icon={Shield}
          description="System lifetime"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ticket Volume Trend</CardTitle>
            <CardDescription>Daily breakdown of moderation activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.ticketsPerDay || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="_id" className="text-xs" tick={{ fill: "var(--muted-foreground)" }} />
                  <YAxis className="text-xs" tick={{ fill: "var(--muted-foreground)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      color: "var(--card-foreground)",
                    }}
                  />
                  <Bar dataKey="count" fill="var(--chart-1)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Moderation Volume</CardTitle>
            <CardDescription>Live stream of platform actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 min-h-[16rem]">
              {activities.length > 0 ? (
                activities.map((activity) => (
                  <div key={activity._id} className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary shrink-0">
                      {activity.performedBy?.username?.slice(0, 2).toUpperCase() || "SY"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-none">
                        {activity.performedBy?.username || "System"}
                        <span className="ml-2 font-normal text-muted-foreground">{activity.action.replace("moderation:", "acted on ticket: ")}</span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground truncate">
                        Target: {activity.targetType} ({activity.targetId.slice(-6).toUpperCase()})
                      </p>
                    </div>
                    <div className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                      {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-48">
                  <Activity className="h-8 w-8 text-muted-foreground opacity-30" />
                  <p className="mt-2 text-sm text-muted-foreground">No recent activity detected</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base">Recent Tickets</CardTitle>
            <CardDescription>Latest moderation tickets from the queue</CardDescription>
          </div>
          <Link href="/moderator/queue">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View All <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 text-xs font-medium text-muted-foreground">Ticket</th>
                  <th className="pb-3 text-xs font-medium text-muted-foreground">Type</th>
                  <th className="pb-3 text-xs font-medium text-muted-foreground">Severity</th>
                  <th className="pb-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 text-xs font-medium text-muted-foreground">User</th>
                  <th className="pb-3 text-xs font-medium text-muted-foreground">Time</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentTickets?.map((ticket: any) => (
                  <tr key={ticket._id} className="border-b border-border last:border-0">
                    <td className="py-3 text-sm font-mono font-medium text-foreground">{ticket._id.slice(-8).toUpperCase()}</td>
                    <td className="py-3 text-sm text-foreground">{ticket.type}</td>
                    <td className="py-3">
                      <Badge variant="outline" className={severityColors[ticket.severity]}>
                        {ticket.severity}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Badge variant="outline" className={statusColors[ticket.status]}>
                        {ticket.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-3 text-sm font-mono text-muted-foreground">{ticket.reportedUser?.username || "anon"}</td>
                    <td className="py-3 text-sm text-muted-foreground">{new Date(ticket.createdAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
                {(!data?.recentTickets || data.recentTickets.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No recent tickets</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const severityColors: Record<string, string> = {
  critical: "bg-destructive/10 text-destructive-foreground",
  high: "bg-warning/10 text-warning-foreground",
  medium: "bg-chart-5/10 text-chart-5",
  low: "bg-muted text-muted-foreground",
}

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning-foreground",
  in_review: "bg-chart-1/10 text-chart-1",
  resolved: "bg-success/10 text-success",
  escalated: "bg-destructive/10 text-destructive-foreground",
}
