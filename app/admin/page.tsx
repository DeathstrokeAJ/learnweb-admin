"use client"

import { useEffect, useState } from "react"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  MessageSquare,
  Building2,
  Shield,
  TrendingUp,
  Activity,
  Zap,
  Globe,
  ArrowRight,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { api } from "@/lib/api-client"

export default function AdminOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response: any = await api.get("/api/admin/overview")
        setData(response)
      } catch (error) {
        console.error("Failed to fetch admin stats:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>
  }

  const moderationBreakdown = [
    { name: "Active", value: data?.activeCommunities || 0, color: "var(--chart-1)" },
    { name: "Total", value: data?.totalCommunities || 0, color: "var(--chart-2)" },
    { name: "Open Tickets", value: data?.openTickets || 0, color: "var(--chart-5)" },
  ]

  const systemMetrics = [
    { time: "Now", cpu: 25, memory: 42, latency: 120 },
  ]
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Overview</h1>
          <p className="text-sm text-muted-foreground">System-wide metrics and platform health</p>
        </div>
        <Badge variant="outline" className="gap-1.5 bg-success/10 text-success">
          <Activity className="h-3 w-3" /> All Systems Operational
        </Badge>
      </div>

      {/* Top Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={data?.totalUsers || 0} icon={Users} />
        <StatCard title="Total Posts" value={data?.totalPosts || 0} icon={MessageSquare} />
        <StatCard title="Active Today" value={data?.activeToday || 0} icon={Zap} />
        <StatCard title="Open Tickets" value={data?.openTickets || 0} icon={Shield} className="border-warning/20" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">User Growth</CardTitle>
            <CardDescription>Platform registration trend (recent)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.userGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="_id" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      color: "var(--card-foreground)",
                    }}
                  />
                  <Area type="monotone" dataKey="count" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Content Volume</CardTitle>
            <CardDescription>Posts per day trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.postsPerDay || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="_id" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
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
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Content Engagement</CardTitle>
            <CardDescription>Engagement breakdown by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.engagementByType || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="_id"
                  >
                    {data?.engagementByType?.map((entry: any, idx: number) => (
                      <Cell key={idx} fill={`var(--chart-${(idx % 5) + 1})`} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      color: "var(--card-foreground)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {data?.engagementByType?.map((item: any, idx: number) => (
                <div key={item._id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: `var(--chart-${(idx % 5) + 1})` }} />
                  {item._id}: {item.count}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">System Performance</CardTitle>
            <CardDescription>Real-time platform monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-56 items-center justify-center border border-dashed border-border rounded-md">
              <div className="text-center">
                <Activity className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
                <p className="mt-2 text-sm text-muted-foreground">System metrics telemetry active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Audit Log</CardTitle>
          <CardDescription>Latest administrative actions across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 text-xs font-medium text-muted-foreground">Action</th>
                  <th className="pb-3 text-xs font-medium text-muted-foreground">Actor</th>
                  <th className="pb-3 text-xs font-medium text-muted-foreground">Target</th>
                  <th className="pb-3 text-xs font-medium text-muted-foreground">Detail</th>
                  <th className="pb-3 text-xs font-medium text-muted-foreground">Time</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentAuditLogs?.map((log: any, idx: number) => (
                  <tr key={idx} className="border-b border-border last:border-0">
                    <td className="py-3 text-sm font-medium text-foreground">{log.action}</td>
                    <td className="py-3 text-sm font-mono text-muted-foreground">{log.performedBy?.username || "system"}</td>
                    <td className="py-3 text-sm font-mono text-foreground">{log.targetType} ({log.targetId?.slice(-6)})</td>
                    <td className="py-3 text-sm text-muted-foreground">{log.details ? JSON.stringify(log.details).slice(0, 50) + "..." : "No details"}</td>
                    <td className="py-3 text-sm text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {(!data?.recentAuditLogs || data.recentAuditLogs.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No recent audit logs</td>
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
