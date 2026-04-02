"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Eye,
} from "lucide-react"
import { api } from "@/lib/api-client"

const trustLevelConfig: Record<string, { color: string; icon: typeof Shield; label: string }> = {
  trusted: { color: "bg-success/10 text-success", icon: ShieldCheck, label: "Trusted" },
  neutral: { color: "bg-muted text-muted-foreground", icon: Shield, label: "Neutral" },
  warning: { color: "bg-warning/10 text-warning-foreground", icon: AlertTriangle, label: "Warning" },
  restricted: { color: "bg-destructive/10 text-destructive-foreground", icon: ShieldAlert, label: "Restricted" },
}

export default function UserRiskProfilesPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [riskFilter, setRiskFilter] = useState("all")
  const [selected, setSelected] = useState<any | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      setLoading(true)
      const response: any = await api.get("/api/moderation/users")
      setUsers(Array.isArray(response) ? response : [])
    } catch (error) {
      console.error("Failed to fetch user risk profiles:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (userId: string, action: string) => {
    try {
      await api.patch("/api/moderation/users", { userId, action })
      fetchUsers()
      setSelected(null)
    } catch (error) {
      console.error(`Failed to ${action} user:`, error)
    }
  }

  const filtered = users.filter((u: any) => {
    if (riskFilter !== "all" && u.trustLevel !== riskFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return u.username?.toLowerCase().includes(q) || (u.displayName && u.displayName.toLowerCase().includes(q))
    }
    return true
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Risk Profiles</h1>
          <p className="text-sm text-muted-foreground">Identify and manage high-risk user accounts and behavior</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Risk Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="trusted">Trusted</SelectItem>
            <SelectItem value="neutral">Neutral</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="restricted">Restricted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          <p className="col-span-full py-20 text-center text-muted-foreground">Loading users...</p>
        ) : filtered.length === 0 ? (
          <p className="col-span-full py-20 text-center text-muted-foreground">No high-risk users found</p>
        ) : filtered.map((user) => {
          const config = trustLevelConfig[user.trustLevel] || trustLevelConfig.neutral
          const Icon = config.icon
          const riskScore = user.moderationMetadata?.riskScore || 0
          return (
            <Card
              key={user._id}
              className="cursor-pointer transition-colors hover:bg-accent/50 text-foreground"
              onClick={() => setSelected(user)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border border-border">
                    <AvatarFallback>{user.username ? user.username[0].toUpperCase() : "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{user.displayName || user.username}</h3>
                      <Badge variant="outline" className={config.color}>
                        <Icon className="mr-1 h-3.5 w-3.5" />
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Risk Score</span>
                    <span className={riskScore > 70 ? "text-destructive-foreground font-bold" : ""}>{riskScore}%</span>
                  </div>
                  <Progress value={riskScore} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl text-foreground">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>User Analysis: {selected.username}</DialogTitle>
                <DialogDescription>Account details and moderation history</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="history">Moderation History</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="pt-4">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="rounded-md border border-border p-3 text-center">
                      <p className="text-lg font-bold">{selected.moderationMetadata?.flaggedContentCount || 0}</p>
                      <p className="text-xs text-muted-foreground">Flags</p>
                    </div>
                    <div className="rounded-md border border-border p-3 text-center">
                      <p className="text-lg font-bold">{selected.moderationMetadata?.resolvedTicketsCount || 0}</p>
                      <p className="text-xs text-muted-foreground">Violations</p>
                    </div>
                    <div className="rounded-md border border-border p-3 text-center text-destructive-foreground">
                      <p className="text-lg font-bold">{selected.moderationMetadata?.riskScore || 0}%</p>
                      <p className="text-xs text-muted-foreground">Risk</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleAction(selected._id, "warn")}>Send Warning</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleAction(selected._id, "suspend")}>Suspend User</Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
