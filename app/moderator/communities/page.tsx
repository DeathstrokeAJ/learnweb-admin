"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Users,
  Settings,
} from "lucide-react"
import { api } from "@/lib/api-client"

const statusConfig: Record<string, { color: string; label: string }> = {
  active: { color: "bg-success/10 text-success", label: "Active" },
  under_review: { color: "bg-warning/10 text-warning-foreground", label: "Under Review" },
  quarantined: { color: "bg-destructive/10 text-destructive-foreground", label: "Quarantined" },
  pending: { color: "bg-muted text-muted-foreground", label: "Pending" },
}

function HealthScoreCircle({ score }: { score: number }) {
  const color = score >= 85 ? "text-success" : score >= 65 ? "text-warning-foreground" : "text-destructive-foreground"
  return (
    <div className="flex flex-col items-center">
      <span className={`text-2xl font-bold ${color}`}>{score}</span>
      <span className="text-xs text-muted-foreground">Health</span>
    </div>
  )
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selected, setSelected] = useState<any | null>(null)

  useEffect(() => {
    fetchCommunities()
  }, [])

  async function fetchCommunities() {
    try {
      const response: any = await api.get("/api/communities/managed")
      setCommunities(Array.isArray(response) ? response : [])
    } catch (error) {
      console.error("Failed to fetch managed communities:", error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = communities.filter((c: any) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Community Oversight</h1>
        <p className="text-sm text-muted-foreground">Monitor community health, activity, and content violations</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search communities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="quarantined">Quarantined</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          <p className="col-span-full py-20 text-center text-muted-foreground">Loading communities...</p>
        ) : filtered.length === 0 ? (
          <p className="col-span-full py-20 text-center text-muted-foreground">No communities found</p>
        ) : filtered.map((community) => (
          <Card
            key={community._id}
            className="cursor-pointer transition-colors hover:bg-accent/50 text-foreground"
            onClick={() => setSelected(community)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{community.name}</CardTitle>
                  <CardDescription className="font-mono text-xs">{community.slug || community._id.slice(-6)}</CardDescription>
                </div>
                <HealthScoreCircle score={community.stats?.healthScore || 100} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">{community.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Badge variant="outline" className={statusConfig[community.status]?.color || statusConfig.active.color}>
                  {statusConfig[community.status]?.label || "Active"}
                </Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" /> {community.members?.length || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selected.name}
                  <Badge variant="outline" className={statusConfig[selected.status]?.color || statusConfig.active.color}>
                    {statusConfig[selected.status]?.label || "Active"}
                  </Badge>
                </DialogTitle>
                <DialogDescription>{selected.slug} - {selected.description}</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="activity">
                <TabsList>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="activity" className="pt-4 text-foreground">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="rounded-md border border-border p-3 text-center">
                      <p className="text-2xl font-bold">{selected.members?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">Members</p>
                    </div>
                    <div className="rounded-md border border-border p-3 text-center">
                      <p className="text-2xl font-bold">{selected.moderators?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">Moderators</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="pt-4 text-foreground">
                  <div className="flex flex-col gap-4">
                    <div className="rounded-md border border-border p-3">
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-sm text-muted-foreground">{new Date(selected.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Settings className="h-3.5 w-3.5" /> Edit Rules
                      </Button>
                    </div>
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
