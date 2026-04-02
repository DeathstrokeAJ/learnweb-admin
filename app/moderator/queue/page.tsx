"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  MessageSquare,
  Clock,
} from "lucide-react"
import { api } from "@/lib/api-client"

const severityConfig: Record<string, { color: string; priority: number }> = {
  critical: { color: "bg-destructive/10 text-destructive-foreground", priority: 4 },
  high: { color: "bg-warning/10 text-warning-foreground", priority: 3 },
  medium: { color: "bg-chart-5/10 text-chart-5", priority: 2 },
  low: { color: "bg-muted text-muted-foreground", priority: 1 },
}

const statusConfig: Record<string, string> = {
  pending: "bg-warning/10 text-warning-foreground",
  in_review: "bg-chart-1/10 text-chart-1",
  resolved: "bg-success/10 text-success",
  escalated: "bg-destructive/10 text-destructive-foreground",
}

function AiScoreBadge({ score }: { score: number }) {
  const color =
    score >= 0.8
      ? "text-destructive-foreground"
      : score >= 0.6
        ? "text-warning-foreground"
        : "text-muted-foreground"
  return (
    <span className={`font-mono text-xs font-bold ${color}`}>
      {(score * 100).toFixed(0)}%
    </span>
  )
}

export default function ModerationQueuePage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selected, setSelected] = useState<any | null>(null)
  const [actionNote, setActionNote] = useState("")

  useEffect(() => {
    fetchTickets()
  }, [])

  async function fetchTickets() {
    try {
      setLoading(true)
      const response: any = await api.get("/api/moderation/tickets")
      setTickets(Array.isArray(response) ? response : [])
    } catch (error) {
      console.error("Failed to fetch tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: string) => {
    if (!selected) return
    try {
      await api.patch(`/api/moderation/tickets/${selected._id}`, {
        action: action,
        note: actionNote
      })
      fetchTickets()
      setSelected(null)
      setActionNote("")
    } catch (error) {
      console.error(`Failed to ${action} ticket:`, error)
    }
  }

  const filtered = tickets
    .filter((t: any) => {
      if (severityFilter !== "all" && t.severity !== severityFilter) return false
      if (statusFilter !== "all" && t.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          t._id.toLowerCase().includes(q) ||
          (t.user && t.user.username.toLowerCase().includes(q)) ||
          t.type.toLowerCase().includes(q) ||
          t.content.toLowerCase().includes(q)
        )
      }
      return true
    })
    .sort((a, b) => (severityConfig[b.severity]?.priority || 0) - (severityConfig[a.severity]?.priority || 0))

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Moderation Queue</h1>
          <p className="text-sm text-muted-foreground">Review and act on flagged content and user reports</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tickets, users, content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-foreground">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground w-16">Priority联</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Type & Content</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">User</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-center">AI Score</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Time</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading queue...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No tickets in the queue</td></tr>
                ) : filtered.map((ticket) => (
                  <tr key={ticket._id} className="border-b border-border last:border-0 hover:bg-accent/50">
                    <td className="px-4 py-3">
                      <div className={`flex h-6 w-1 items-center rounded-full ${severityConfig[ticket.severity]?.color || ""}`} />
                    </td>
                    <td className="px-4 py-3 max-w-md">
                      <div>
                        <Badge variant="outline" className="mb-1 text-[10px] uppercase tracking-wider">
                          {ticket.type}
                        </Badge>
                        <p className="line-clamp-1 text-sm">{ticket.content}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{ticket.user?.username || "Anonymous"}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <AiScoreBadge score={ticket.aiAnalysis?.score || 0} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={statusConfig[ticket.status]}>
                        {ticket.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(ticket)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl text-foreground">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Review Ticket: {selected._id.slice(-8)}
                  <Badge variant="outline" className={severityConfig[selected.severity]?.color}>
                    {selected.severity}
                  </Badge>
                </DialogTitle>
                <DialogDescription>Reported on {new Date(selected.createdAt).toLocaleString()}</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="rounded-md border border-border p-4">
                  <Label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Content Preview</Label>
                  <p className="text-sm">{selected.content}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs font-medium text-muted-foreground">Reason</p>
                    <p className="text-sm">{selected.reason}</p>
                  </div>
                  <div className="rounded-md border border-border p-3 text-center">
                    <p className="text-xs font-medium text-muted-foreground">AI Risk Confidence</p>
                    <AiScoreBadge score={selected.aiAnalysis?.score || 0} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Moderator Note</Label>
                  <Textarea
                    placeholder="Add a reason for your action..."
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => handleAction("in_review")} className="gap-2">
                  <AlertTriangle className="h-4 w-4" /> Flag for Review
                </Button>
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={() => handleAction("resolved")} className="gap-2">
                    <XCircle className="h-4 w-4" /> Remove Content
                  </Button>
                  <Button variant="success" onClick={() => handleAction("resolved")} className="gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Dismiss Report
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
