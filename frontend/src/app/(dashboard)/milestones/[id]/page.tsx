"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMilestoneStore } from "@/features/milestones/stores/milestoneStore";
import {
  ArrowLeft, CheckCircle2, Clock, Calendar, AlertTriangle,
  Trash2, Bell, BellRing, Users, Target
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export default function MilestoneDetailPage() {
  const router = useRouter();
  const params = useParams();
  const milestoneId = params.id as string;

  const {
    milestones, timeline, history, reminders,
    fetchMilestones, fetchTimeline, fetchHistory, fetchReminders,
    completeMilestone, updateMilestone, deleteMilestone, generateReminders
  } = useMilestoneStore();

  const [activeTab, setActiveTab] = useState<"timeline" | "history" | "reminders">("timeline");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  const milestone = milestones.find((m) => m.id === milestoneId);
  const timelineEntries = timeline.filter((t) => t.id === milestoneId);

  useEffect(() => {
    if (milestone?.projectGroupId) {
      fetchMilestones(milestone.projectGroupId);
      fetchTimeline(milestone.projectGroupId);
      fetchHistory(milestone.projectGroupId);
      fetchReminders(milestoneId);
    }
  }, [milestone?.projectGroupId, milestoneId, fetchMilestones, fetchTimeline, fetchHistory, fetchReminders]);

  useEffect(() => {
    if (milestone) {
      setEditTitle(milestone.title);
      setEditDescription(milestone.description || "");
      setEditDueDate(new Date(milestone.dueDate).toISOString().split("T")[0]);
    }
  }, [milestone]);

  const handleSaveEdit = async () => {
    if (!milestone) return;
    await updateMilestone(milestone.id, {
      title: editTitle,
      description: editDescription || undefined,
      dueDate: editDueDate,
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!milestone) return;
    if (confirm("Delete this milestone?")) {
      await deleteMilestone(milestone.id);
      router.push("/milestones");
    }
  };

  const handleGenerateReminders = async () => {
    if (!milestone) return;
    await generateReminders(milestone.id);
  };

  const isOverdue = milestone && !milestone.isCompleted && new Date(milestone.dueDate) < new Date();

  const statusColors = {
    NotStarted: "bg-gray-500/20 text-gray-400",
    InProgress: "bg-blue-500/20 text-blue-400",
    Completed: "bg-emerald-500/20 text-emerald-400",
    Delayed: "bg-amber-500/20 text-amber-400",
    Cancelled: "bg-red-500/20 text-red-400",
  };

  if (!milestone) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Target className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading milestone...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" onClick={() => router.push("/milestones")} className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" /> All Milestones
          </Button>

          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 p-6 sm:p-8">
            <div className="relative z-10">
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-9 font-bold text-lg"
                  />
                  <Input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description"
                    className="h-9"
                  />
                  <Input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="h-9"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{milestone.title}</h1>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[milestone.status as keyof typeof statusColors] || "bg-white/10 text-muted-foreground"}`}>
                      {milestone.status}
                    </span>
                  </div>
                  {milestone.description && <p className="text-muted-foreground mt-1">{milestone.description}</p>}
                </>
              )}
            </div>
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-sm font-bold">{format(new Date(milestone.startDate), "MMM d")}</p>
              <p className="text-xs text-muted-foreground">Start Date</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className={`h-5 w-5 mx-auto mb-2 ${isOverdue ? "text-amber-400" : "text-blue-400"}`} />
              <p className="text-sm font-bold">{format(new Date(milestone.dueDate), "MMM d")}</p>
              <p className="text-xs text-muted-foreground">Due Date</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">{milestone.assignedMembers.length}</p>
              <p className="text-xs text-muted-foreground">Assigned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              {isOverdue ? (
                <AlertTriangle className="h-5 w-5 text-amber-400 mx-auto mb-2" />
              ) : milestone.isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
              ) : (
                <Target className="h-5 w-5 text-primary mx-auto mb-2" />
              )}
              <p className="text-sm font-bold">
                {isOverdue ? "Overdue" : milestone.isCompleted ? "Done" : formatDistanceToNow(new Date(milestone.dueDate), { addSuffix: true })}
              </p>
              <p className="text-xs text-muted-foreground">Status</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Assigned Members */}
        {milestone.assignedMembers.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Assigned Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {milestone.assignedMembers.map((member) => (
                    <div key={member.userId} className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs">
                      <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                        {member.name[0]}
                      </div>
                      {member.name}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex gap-1 mb-4 border-b border-white/10">
            {(["timeline", "history", "reminders"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Timeline Tab */}
          {activeTab === "timeline" && (
            <Card>
              <CardContent className="p-6">
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
                  <div className="space-y-6">
                    {timeline.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No timeline data available</p>
                    ) : (
                      timeline.map((entry, i) => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 * i }}
                          className="relative pl-10"
                        >
                          <div className={`absolute left-2.5 top-1 h-3 w-3 rounded-full border-2 ${
                            entry.isCompleted
                              ? "bg-emerald-500 border-emerald-500"
                              : new Date(entry.dueDate) < new Date()
                              ? "bg-amber-500 border-amber-500"
                              : "bg-white/10 border-white/20"
                          }`} />
                          <div>
                            <p className="text-sm font-medium">{entry.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(new Date(entry.startDate), "MMM d")} - {format(new Date(entry.dueDate), "MMM d")}
                            </p>
                            {entry.assignedMembers.length > 0 && (
                              <div className="flex gap-1 mt-1.5">
                                {entry.assignedMembers.slice(0, 3).map((m) => (
                                  <span key={m.userId} className="text-[10px] text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded">
                                    {m.name}
                                  </span>
                                ))}
                                {entry.assignedMembers.length > 3 && (
                                  <span className="text-[10px] text-muted-foreground">+{entry.assignedMembers.length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <Card>
              <CardContent className="p-6">
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No completed milestones yet</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <div>
                            <p className="text-sm font-medium">{entry.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Completed by {entry.completedBy} &middot; {format(new Date(entry.completedAt), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          entry.wasOnTime ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                        }`}>
                          {entry.wasOnTime ? "On Time" : "Late"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Reminders Tab */}
          {activeTab === "reminders" && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    Auto-generated reminders for this milestone
                  </p>
                  <Button size="sm" variant="outline" onClick={handleGenerateReminders} className="gap-1">
                    <BellRing className="h-3 w-3" /> Generate
                  </Button>
                </div>
                {reminders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No reminders configured</p>
                ) : (
                  <div className="space-y-2">
                    {reminders.map((r) => (
                      <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]">
                        <div className="flex items-center gap-3">
                          <Bell className={`h-4 w-4 ${r.isSent ? "text-emerald-400" : "text-muted-foreground"}`} />
                          <div>
                            <p className="text-sm font-medium">
                              {r.reminderType === "OverdueAlert"
                                ? "Overdue Alert"
                                : r.daysBeforeDue === 0
                                ? "Due Today"
                                : `${r.daysBeforeDue} day${r.daysBeforeDue > 1 ? "s" : ""} before due`}
                            </p>
                            {r.sentAt && (
                              <p className="text-xs text-muted-foreground">
                                Sent {format(new Date(r.sentAt), "MMM d, yyyy")}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          r.isSent ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-muted-foreground"
                        }`}>
                          {r.isSent ? "Sent" : "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                {!milestone.isCompleted && (
                  <Button onClick={() => completeMilestone(milestone.id)} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Mark Complete
                  </Button>
                )}
                <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? "Cancel Edit" : "Edit Milestone"}
                </Button>
                <Button variant="destructive" onClick={handleDelete} className="gap-1 ml-auto">
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
