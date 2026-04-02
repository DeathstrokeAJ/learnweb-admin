"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    MessageSquare,
    AlertCircle,
    ExternalLink,
} from "lucide-react"
import { api } from "@/lib/api-client"
import { formatDistanceToNow } from "date-fns"

interface Request {
    _id: string
    name: string
    slug: string
    description: string
    purpose: string
    status: "pending" | "approved" | "rejected" | "auto_rejected"
    requestedBy: {
        _id: string
        username: string
        email: string
        avatar?: string
    }
    reviewNote?: string
    createdAt: string
}

export default function CommunityRequestsPage() {
    const [requests, setRequests] = useState<Request[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)

    // Dialog states
    const [isApproveOpen, setIsApproveOpen] = useState(false)
    const [isRejectOpen, setIsRejectOpen] = useState(false)
    const [reviewNote, setReviewNote] = useState("")
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        fetchRequests()
    }, [])

    async function fetchRequests() {
        try {
            setLoading(true)
            const res: any = await api.get("/api/admin/community-requests")
            setRequests(res.requests || [])
        } catch (error) {
            console.error("Failed to fetch requests", error)
        } finally {
            setLoading(false)
        }
    }

    async function handleAction(action: "approve" | "reject") {
        if (!selectedRequest) return
        try {
            setProcessing(true)
            await api.patch(`/api/admin/community-requests/${selectedRequest._id}`, {
                action,
                reviewNote: reviewNote || undefined
            })

            // Update local state
            setRequests(current =>
                current.map(r => r._id === selectedRequest._id
                    ? { ...r, status: action === "approve" ? "approved" : "rejected", reviewNote }
                    : r
                )
            )

            setIsApproveOpen(false)
            setIsRejectOpen(false)
            setReviewNote("")
            setSelectedRequest(null)
        } catch (error) {
            console.error(`Failed to ${action} request`, error)
            alert(`Failed to ${action}: ${(error as any).message}`)
        } finally {
            setProcessing(false)
        }
    }

    const openApprove = (req: Request) => {
        setSelectedRequest(req)
        setReviewNote("")
        setIsApproveOpen(true)
    }

    const openReject = (req: Request) => {
        setSelectedRequest(req)
        setReviewNote("")
        setIsRejectOpen(true)
    }

    // Filtering
    const filterRequests = (statusFilter: string) => {
        return requests.filter(r => {
            // Status filter
            if (statusFilter !== "all" && r.status !== statusFilter) return false

            // Search filter
            if (!search) return true
            const q = search.toLowerCase()
            return (
                r.name.toLowerCase().includes(q) ||
                r.requestedBy.username.toLowerCase().includes(q) ||
                r.requestedBy.email.toLowerCase().includes(q)
            )
        })
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Community Requests</h1>
                    <p className="text-sm text-muted-foreground">Review and manage community creation proposals</p>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search request..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="pending">Pending ({requests.filter(r => r.status === "pending").length})</TabsTrigger>
                    <TabsTrigger value="all">All Requests</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>

                {["pending", "all", "approved", "rejected"].map((tab) => (
                    <TabsContent key={tab} value={tab} className="mt-0">
                        <Card>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-border text-left bg-muted/30">
                                                <th className="px-4 py-3 text-xs font-medium text-muted-foreground w-[250px]">Community Info</th>
                                                <th className="px-4 py-3 text-xs font-medium text-muted-foreground w-[200px]">Requested By</th>
                                                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Purpose & Justification</th>
                                                <th className="px-4 py-3 text-xs font-medium text-muted-foreground w-[120px]">Status</th>
                                                <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">Loading requests...</td></tr>
                                            ) : filterRequests(tab).length === 0 ? (
                                                <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No requests found.</td></tr>
                                            ) : filterRequests(tab).map((req) => (
                                                <tr key={req._id} className="border-b border-border last:border-0 hover:bg-accent/30 group">
                                                    {/* Community Info */}
                                                    <td className="px-4 py-4 align-top">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="font-semibold text-foreground flex items-center gap-2">
                                                                {req.name}
                                                                <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                                    c/{req.slug}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground line-clamp-2">{req.description}</p>
                                                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                                                <Clock className="h-3 w-3" />
                                                                {formatDistanceToNow(new Date(req.createdAt))} ago
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Requestor */}
                                                    <td className="px-4 py-4 align-top">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={req.requestedBy.avatar} />
                                                                <AvatarFallback className="bg-primary/10 text-xs text-primary">
                                                                    {req.requestedBy.username[0].toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="text-sm font-medium">{req.requestedBy.username}</p>
                                                                <p className="text-xs text-muted-foreground">{req.requestedBy.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Purpose */}
                                                    <td className="px-4 py-4 align-top">
                                                        <div className="text-sm text-foreground/90 max-w-md">
                                                            <p className="whitespace-pre-wrap">{req.purpose}</p>
                                                            {req.reviewNote && (
                                                                <div className="mt-2 p-2 bg-muted/50 rounded text-xs border border-border">
                                                                    <span className="font-semibold block mb-0.5">Note:</span>
                                                                    {req.reviewNote}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-4 py-4 align-top">
                                                        {req.status === "pending" && (
                                                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20">
                                                                Pending
                                                            </Badge>
                                                        )}
                                                        {req.status === "approved" && (
                                                            <Badge variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
                                                                Approved
                                                            </Badge>
                                                        )}
                                                        {req.status === "rejected" && (
                                                            <Badge variant="outline" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">
                                                                Rejected
                                                            </Badge>
                                                        )}
                                                        {req.status === "auto_rejected" && (
                                                            <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/20">
                                                                Auto-Rejected
                                                            </Badge>
                                                        )}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-4 py-4 align-top text-right">
                                                        {req.status === "pending" && (
                                                            <div className="flex justify-end gap-2">
                                                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-500 hover:text-green-600 hover:bg-green-50" onClick={() => openApprove(req)}>
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                </Button>
                                                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => openReject(req)}>
                                                                    <XCircle className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>

            {/* APPROVE DIALOG */}
            <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Community</DialogTitle>
                        <DialogDescription>
                            This will create the community <strong>{selectedRequest?.name}</strong> and make {selectedRequest?.requestedBy.username} the admin.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Label htmlFor="note">Optional Note</Label>
                        <Textarea
                            id="note"
                            placeholder="Good luck with your new community!"
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsApproveOpen(false)}>Cancel</Button>
                        <Button onClick={() => handleAction("approve")} disabled={processing} className="bg-green-600 hover:bg-green-700">
                            {processing ? "Creating..." : "Approve & Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* REJECT DIALOG */}
            <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Request</DialogTitle>
                        <DialogDescription>
                            Why are you rejecting this request?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Label htmlFor="reject-note">Reason (Required)</Label>
                        <Textarea
                            id="reject-note"
                            placeholder="e.g. Too generic, Duplicate, Violation of terms..."
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
                        <Button onClick={() => handleAction("reject")} disabled={processing || !reviewNote.trim()} variant="destructive">
                            {processing ? "Rejecting..." : "Reject Request"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
