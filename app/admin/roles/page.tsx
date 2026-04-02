"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import {
  Search,
  UserCog,
  Shield,
  ShieldCheck,
  Crown,
  User,
  UserPlus,
  MoreVertical,
  Pencil,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api } from "@/lib/api-client"

const roleConfig: Record<string, { color: string; icon: typeof User; label: string }> = {
  SUPER_ADMIN: { color: "bg-chart-4/10 text-chart-4", icon: Crown, label: "Super Admin" },
  SENIOR_MODERATOR: { color: "bg-chart-1/10 text-chart-1", icon: ShieldCheck, label: "Senior Mod" },
  MODERATOR: { color: "bg-chart-2/10 text-chart-2", icon: Shield, label: "Moderator" },
  USER: { color: "bg-muted text-muted-foreground", icon: User, label: "User" },
}

export default function RoleManagementPage() {
  const [team, setTeam] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [selectedMember, setSelectedMember] = useState<any | null>(null)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState("")

  useEffect(() => {
    fetchTeam()
  }, [])

  async function fetchTeam() {
    try {
      const response: any = await api.get("/api/admin/roles")
      setTeam(Array.isArray(response) ? response : [])
    } catch (error) {
      console.error("Failed to fetch team:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedMember || !newRole) return
    try {
      await api.patch("/api/admin/roles", { userId: selectedMember._id, newRole })
      fetchTeam()
      setIsRoleDialogOpen(false)
      setSelectedMember(null)
    } catch (error) {
      console.error("Failed to update role:", error)
    }
  }

  const filtered = team.filter((m: any) => {
    if (roleFilter !== "all" && m.role !== roleFilter) return false
    const q = search.toLowerCase()
    return m.username.toLowerCase().includes(q) || (m.displayName && m.displayName.toLowerCase().includes(q))
  })

  const roleCounts = {
    SUPER_ADMIN: team.filter((m) => m.role === "SUPER_ADMIN").length,
    SENIOR_MODERATOR: team.filter((m) => m.role === "SENIOR_MODERATOR").length,
    MODERATOR: team.filter((m) => m.role === "MODERATOR").length,
    USER: team.filter((m) => m.role === "USER").length,
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Role Management</h1>
          <p className="text-sm text-muted-foreground">Manage team roles, permissions, and access levels</p>
        </div>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(roleConfig).map(([key, config]) => {
          const Icon = config.icon
          return (
            <Card key={key} className="gap-0 text-foreground">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-md ${config.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {roleCounts[key as keyof typeof roleCounts] || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search team members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
            <SelectItem value="SENIOR_MODERATOR">Senior Moderator</SelectItem>
            <SelectItem value="MODERATOR">Moderator</SelectItem>
            <SelectItem value="USER">User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Member</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Joined</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading team...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No members found</td></tr>
                ) : filtered.map((member) => {
                  const config = roleConfig[member.role] || roleConfig.USER
                  const Icon = config.icon
                  return (
                    <tr key={member._id} className="border-b border-border last:border-0 hover:bg-accent/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-xs text-primary">
                              {member.displayName ? member.displayName[0] : member.username[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-foreground">{member.displayName || member.username}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={config.color}>
                          <Icon className="mr-1 h-3 w-3" />
                          {config.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={member.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}
                        >
                          {member.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedMember(member); setNewRole(member.role); setIsRoleDialogOpen(true); }}>
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Change Role
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User Role</DialogTitle>
            <DialogDescription>
              Change the administrative permissions for {selectedMember?.displayName || selectedMember?.username}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>New Role</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="MODERATOR">Moderator</SelectItem>
                <SelectItem value="SENIOR_MODERATOR">Senior Moderator</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateRole}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
