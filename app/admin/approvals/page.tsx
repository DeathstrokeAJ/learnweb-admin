"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  MessageSquare,
  Eye,
  Building2,
} from "lucide-react"
import { api } from "@/lib/api-client"

const statusConfig: Record<string, { color: string; icon: typeof Clock }> = {
  pending: { color: "bg-warning/10 text-warning-foreground", icon: Clock },
  approved: { color: "bg-success/10 text-success", icon: CheckCircle2 },
  rejected: { color: "bg-destructive/10 text-destructive-foreground", icon: XCircle },
}

export default function CommunityApprovalsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState("pending")
  const [selected, setSelected] = useState<any | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")

  useEffect(() => {
    fetchRequests()
  }, [])

  async function fetchRequests() {
    try {
      const response: any = await api.get("/api/admin/approvals")
      setRequests(Array.isArray(response) ? response : [])
    } catch (error) {
      console.error("Failed to fetch approvals:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (requestId: string, action: "approve" | "reject") => {
    try {
      await api.post("/api/admin/approvals", { communityId: requestId, action })
      fetchRequests()
      setSelected(null)
    } catch (error) {
      console.error(`Failed to ${action} community:`, error)
    }
  }

  const filtered = requests.filter((r) => {
    if (tab !== "all" && r.status !== tab) return false
    if (search) {
      const q = search.toLowerCase()
      return r.name.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q)
    }
    return true
  })

  const pendingCount = requests.filter((r) => r.status === "pending").length

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Community Approvals</h1>
        <p className="text-sm text-muted-foreground">
          Review and approve new community creation requests ({pendingCount} pending)
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-wrap items-center gap-3">
          <TabsList>
            <TabsTrigger value="pending" className="gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Pending
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{pendingCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <TabsContent value={tab} className="mt-4">
          <div className="flex flex-col gap-3">
            {filtered.map((request) => {
              const config = statusConfig[request.status]
              const StatusIcon = config.icon
              return (
                <Card
                  key={request.id}
                  className="cursor-pointer transition-colors hover:bg-accent/50"
                  onClick={() => setSelected(request)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 shrink-0">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground">{request.name}</span>
                          <span className="font-mono text-xs text-muted-foreground">{request.slug}</span>
                          <Badge variant="outline" className={config.color}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {request.status}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">{request.category}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{request.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span>By: {request.requestedBy}</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> Est. {request.memberEstimate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {request.submittedAt}
                          </span>
                        </div>
                      </div>
                      {request.status === "pending" && (
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-success"
                            onClick={(e) => { e.stopPropagation() }}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-destructive-foreground"
                            onClick={(e) => { e.stopPropagation() }}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {filtered.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 p-12 text-center">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                  <h3 className="font-medium text-foreground">No requests</h3>
                  <p className="text-sm text-muted-foreground">No community requests match the current filter.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setRejectionReason("") }}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selected.name}
                  <Badge variant="outline" className={statusConfig[selected.status].color}>
                    {selected.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription>{selected.slug} - {selected.category}</DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                <div className="rounded-md border border-border p-4">
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="mt-1 text-sm text-foreground">{selected.description}</p>
                </div>

                <div className="rounded-md border border-border p-4">
                  <p className="text-sm font-medium text-muted-foreground">Reason for Creation</p>
                  <p className="mt-1 text-sm text-foreground">{selected.reason}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs text-muted-foreground">Requested By</p>
                    <p className="font-mono text-sm font-medium text-foreground">{selected.requestedBy}</p>
                    <p className="text-xs text-muted-foreground">{selected.requestedByEmail}</p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs text-muted-foreground">Estimated Members</p>
                    <p className="text-sm font-medium text-foreground">{selected.memberEstimate}</p>
                  </div>
                </div>

                <div className="rounded-md border border-border p-4">
                  <p className="text-sm font-medium text-muted-foreground">Proposed Rules</p>
                  <ul className="mt-2 flex flex-col gap-1">
                    {selected.rules.map((rule, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-foreground">
                        <span className="text-muted-foreground">{idx + 1}.</span> {rule}
                      </li>
                    ))}
                  </ul>
                </div>

                {selected.status === "pending" && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="rejection-reason">Rejection Reason (optional)</Label>
                    <Textarea
                      id="rejection-reason"
                      placeholder="Provide a reason if rejecting..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={2}
                    />
                  </div>
                )}
              </div>

              {selected.status === "pending" && (
                <DialogFooter className="flex-col gap-2 sm:flex-row">
                  <Button variant="outline" className="gap-2 text-destructive-foreground" onClick={() => { setSelected(null); setRejectionReason("") }}>
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button className="gap-2" onClick={() => { setSelected(null); setRejectionReason("") }}>
                    <CheckCircle2 className="h-4 w-4" />
                    Approve Community
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
