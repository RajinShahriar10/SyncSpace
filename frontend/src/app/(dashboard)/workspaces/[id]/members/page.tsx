"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWorkspaceStore } from "@/features/workspace/stores/workspaceStore";
import { useAuthStore } from "@/store";
import { ArrowLeft, UserPlus, X, Shield, Edit3, Eye, Crown } from "lucide-react";

const ROLES = [
  { value: "Admin", label: "Admin", icon: Shield, desc: "Full access except delete" },
  { value: "Editor", label: "Editor", icon: Edit3, desc: "Create and edit content" },
  { value: "Viewer", label: "Viewer", icon: Eye, desc: "Read-only access" },
];

const roleColors: Record<string, string> = {
  Owner: "text-amber-400 bg-amber-400/10",
  Admin: "text-red-400 bg-red-400/10",
  Editor: "text-primary bg-primary/10",
  Viewer: "text-muted-foreground bg-white/5",
};

export default function WorkspaceMembersPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  const { user } = useAuthStore();
  const {
    currentWorkspace,
    members,
    fetchWorkspace,
    fetchMembers,
    inviteMember,
    removeMember,
    updateMemberRole,
    isLoading,
  } = useWorkspaceStore();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Editor");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWorkspace(workspaceId);
    fetchMembers(workspaceId);
  }, [workspaceId, fetchWorkspace, fetchMembers]);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setError("");
    setInviting(true);
    try {
      await inviteMember(workspaceId, { email, role });
      setEmail("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to invite";
      setError(message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string, name: string) => {
    if (confirm(`Remove ${name} from this workspace?`)) {
      await removeMember(workspaceId, userId);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    await updateMemberRole(workspaceId, userId, newRole);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Button
            variant="ghost"
            onClick={() => router.push("/workspaces")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground">
            Manage who has access to {currentWorkspace?.name || "this workspace"}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle>Invite Member</CardTitle>
              <CardDescription>Send an invitation to a team member</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="colleague@company.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                  className="flex-1"
                />
                <Button onClick={handleInvite} disabled={inviting} className="gap-2 shrink-0">
                  <UserPlus className="h-4 w-4" />
                  {inviting ? "Sending..." : "Invite"}
                </Button>
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-destructive"
                >
                  {error}
                </motion.p>
              )}
              <div className="flex flex-wrap gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all ${
                      role === r.value
                        ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                        : "bg-white/5 text-muted-foreground hover:bg-white/10"
                    }`}
                  >
                    <r.icon className="h-3.5 w-3.5" />
                    {r.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle>Members ({members.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <AnimatePresence mode="popLayout">
                {members.map((member) => {
                  const isOwner = member.role === "Owner";
                  const isCurrentUser = member.userId === user?.id;
                  const canManage = !isOwner && !isCurrentUser;

                  return (
                    <motion.div
                      key={member.userId}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, x: -20 }}
                      className="glass flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                          {member.userName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {member.userName}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{member.userEmail}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isOwner ? (
                          <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${roleColors["Owner"]}`}>
                            <Crown className="h-3 w-3" />
                            Owner
                          </span>
                        ) : (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                            disabled={!canManage}
                            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-foreground disabled:opacity-50"
                          >
                            <option value="Admin">Admin</option>
                            <option value="Editor">Editor</option>
                            <option value="Viewer">Viewer</option>
                          </select>
                        )}

                        {canManage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleRemove(member.userId, member.userName)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {members.length === 0 && !isLoading && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No members yet. Invite someone to get started.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
