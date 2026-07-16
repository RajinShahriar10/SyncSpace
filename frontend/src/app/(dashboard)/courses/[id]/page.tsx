"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCourseStore } from "@/features/courses/stores/courseStore";
import { useProjectGroupStore } from "@/features/projectGroups/stores/projectGroupStore";
import { useMilestoneStore } from "@/features/milestones/stores/milestoneStore";
import { ArrowLeft, Plus, Users, LayoutGrid, Calendar, Trash2, Target, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const groupSchema = z.object({ groupName: z.string().min(2, "Name required") });
const milestoneSchema = z.object({ title: z.string().min(2, "Title required"), description: z.string().optional(), startDate: z.string().min(1, "Start date required"), dueDate: z.string().min(1, "Due date required") });

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const { currentCourse, fetchCourse, deleteCourse } = useCourseStore();
  const { groups, fetchGroupsByCourse, createGroup, deleteGroup } = useProjectGroupStore();
  const { milestones, fetchMilestones, createMilestone, updateMilestone, deleteMilestone, completeMilestone } = useMilestoneStore();
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateMilestone, setShowCreateMilestone] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const groupForm = useForm<{ groupName: string }>({ resolver: zodResolver(groupSchema) });
  const milestoneForm = useForm<{ title: string; description?: string; startDate: string; dueDate: string }>({ resolver: zodResolver(milestoneSchema) });

  useEffect(() => { fetchCourse(courseId); fetchGroupsByCourse(courseId); }, [courseId, fetchCourse, fetchGroupsByCourse]);

  useEffect(() => {
    if (selectedGroup) fetchMilestones(selectedGroup);
  }, [selectedGroup, fetchMilestones]);

  const onCreateGroup = async (data: { groupName: string }) => {
    await createGroup({ courseId, ...data });
    groupForm.reset();
    setShowCreateGroup(false);
    fetchGroupsByCourse(courseId);
  };

  const onCreateMilestone = async (data: { title: string; description?: string; startDate: string; dueDate: string }) => {
    if (!selectedGroup) return;
    await createMilestone({ ...data, projectGroupId: selectedGroup });
    milestoneForm.reset();
    setShowCreateMilestone(false);
  };

  const completedMilestones = (milestones || []).filter((m) => m.isCompleted).length;
  const upcomingMilestones = (milestones || []).filter((m) => !m.isCompleted && new Date(m.dueDate) > new Date()).length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" onClick={() => router.push("/courses")} className="mb-6 gap-2"><ArrowLeft className="h-4 w-4" /> All Courses</Button>
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 p-6 sm:p-8">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 text-2xl font-bold text-primary shrink-0">{currentCourse?.courseCode?.[0] || "C"}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-muted-foreground">{currentCourse?.courseCode}</p>
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{currentCourse?.courseName}</h1>
                <p className="text-muted-foreground mt-1">{currentCourse?.semester} &middot; {currentCourse?.instructorName}</p>
              </div>
            </div>
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card><CardContent className="p-4 text-center"><Users className="h-5 w-5 text-emerald-400 mx-auto mb-2" /><p className="text-2xl font-bold">{(groups || []).length}</p><p className="text-xs text-muted-foreground">Groups</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><LayoutGrid className="h-5 w-5 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{(groups || []).reduce((s, g) => s + g.workspaceCount, 0)}</p><p className="text-xs text-muted-foreground">Projects</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto mb-2" /><p className="text-2xl font-bold">{completedMilestones}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Clock className="h-5 w-5 text-amber-400 mx-auto mb-2" /><p className="text-2xl font-bold">{upcomingMilestones}</p><p className="text-xs text-muted-foreground">Upcoming</p></CardContent></Card>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Groups */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Project Groups</h2>
              <Button size="sm" className="gap-1" onClick={() => setShowCreateGroup(!showCreateGroup)}><Plus className="h-3 w-3" /> New Group</Button>
            </div>
            {showCreateGroup && (
              <Card className="mb-4 border-primary/20"><CardContent className="p-4">
                <form onSubmit={groupForm.handleSubmit(onCreateGroup)} className="flex gap-2">
                  <Input placeholder="Group name" {...groupForm.register("groupName")} className="h-9 flex-1" />
                  <Button type="submit" size="sm" className="h-9">Create</Button>
                  <Button type="button" variant="ghost" size="sm" className="h-9" onClick={() => setShowCreateGroup(false)}>Cancel</Button>
                </form>
              </CardContent></Card>
            )}
            <div className="space-y-2">
              {(groups || []).map((group) => (
                <Card key={group.id} className={`cursor-pointer transition-all hover:bg-white/[0.07] ${selectedGroup === group.id ? "ring-1 ring-primary/30" : ""}`} onClick={() => { setSelectedGroup(group.id); setShowCreateMilestone(false); }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{group.groupName}</p>
                        <p className="text-xs text-muted-foreground">Led by {group.leaderName} &middot; {group.memberCount} members &middot; {group.workspaceCount} projects</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); if (confirm("Delete group?")) deleteGroup(group.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(groups || []).length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No groups yet. Create one to get started.</p>}
            </div>
          </motion.div>

          {/* Milestones */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Milestones</h2>
              {selectedGroup && <Button size="sm" className="gap-1" onClick={() => setShowCreateMilestone(!showCreateMilestone)}><Plus className="h-3 w-3" /> Add</Button>}
            </div>
            {!selectedGroup ? (
              <p className="text-sm text-muted-foreground text-center py-8">Select a group to view milestones</p>
            ) : showCreateMilestone ? (
              <Card className="border-primary/20"><CardContent className="p-4 space-y-3">
                <form onSubmit={milestoneForm.handleSubmit(onCreateMilestone)} className="space-y-3">
                  <Input placeholder="Title" {...milestoneForm.register("title")} className="h-9" />
                  <Input placeholder="Description (optional)" {...milestoneForm.register("description")} className="h-9" />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
                      <Input type="date" {...milestoneForm.register("startDate")} className="h-9" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Due Date</label>
                      <Input type="date" {...milestoneForm.register("dueDate")} className="h-9" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="h-9">Create</Button>
                    <Button type="button" variant="ghost" size="sm" className="h-9" onClick={() => setShowCreateMilestone(false)}>Cancel</Button>
                  </div>
                </form>
              </CardContent></Card>
            ) : (
              <div className="space-y-2">
                {(milestones || []).map((m) => (
                  <Card key={m.id} className={`cursor-pointer transition-all hover:bg-white/[0.07] ${m.isCompleted ? "opacity-60" : ""}`} onClick={() => router.push(`/milestones/${m.id}`)}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium ${m.isCompleted ? "line-through" : ""}`}>{m.title}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              m.status === "Completed" ? "bg-emerald-500/20 text-emerald-400" :
                              m.status === "InProgress" ? "bg-blue-500/20 text-blue-400" :
                              m.status === "Delayed" ? "bg-amber-500/20 text-amber-400" :
                              "bg-white/10 text-muted-foreground"
                            }`}>{m.status}</span>
                          </div>
                          {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(m.startDate).toLocaleDateString()} - Due {formatDistanceToNow(new Date(m.dueDate), { addSuffix: true })}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {!m.isCompleted && <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-400" onClick={(e) => { e.stopPropagation(); completeMilestone(m.id); }}><CheckCircle2 className="h-3.5 w-3.5" /></Button>}
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); deleteMilestone(m.id); }}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(milestones || []).length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No milestones yet</p>}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
