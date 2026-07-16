"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMilestoneStore } from "@/features/milestones/stores/milestoneStore";
import {
  Plus, Target, CheckCircle2, Clock, AlertTriangle,
  Calendar, ArrowRight, ChevronRight, X
} from "lucide-react";

export default function MilestonesPage() {
  const router = useRouter();
  const {
    milestones, progress, isLoading, fetchMilestones, fetchProgress,
    completeMilestone, deleteMilestone
  } = useMilestoneStore();
  const [showComplete, setShowComplete] = useState<string | null>(null);

  const activeMilestones = (milestones || []).filter((m) => !m.isCompleted);
  const completedMilestones = (milestones || []).filter((m) => m.isCompleted);
  const overdueMilestones = (milestones || []).filter(
    (m) => !m.isCompleted && new Date(m.dueDate) < new Date()
  );

  const statusColors = {
    NotStarted: "bg-gray-500/20 text-gray-400",
    InProgress: "bg-blue-500/20 text-blue-400",
    Completed: "bg-emerald-500/20 text-emerald-400",
    Delayed: "bg-amber-500/20 text-amber-400",
    Cancelled: "bg-red-500/20 text-red-400",
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Milestones</h1>
          <p className="text-muted-foreground mt-1">Track project milestones and deadlines</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{progress?.totalMilestones ?? milestones.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">{progress?.completed ?? completedMilestones.length}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">{progress?.inProgress ?? 0}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-5 w-5 text-amber-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">{progress?.overdue ?? overdueMilestones.length}</p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Completion Percentage */}
        {progress && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Overall Progress</p>
                  <p className="text-sm font-bold text-primary">{progress.completionPercentage}%</p>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.completionPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Active Milestones */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Active Milestones</h2>
            <span className="text-xs text-muted-foreground">{activeMilestones.length} active</span>
          </div>
          <div className="space-y-2">
            {activeMilestones.map((m, i) => {
              const isOverdue = new Date(m.dueDate) < new Date();
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <Card
                    className={`cursor-pointer transition-all hover:bg-white/[0.07] ${
                      isOverdue ? "border-amber-500/30" : ""
                    }`}
                    onClick={() => router.push(`/milestones/${m.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium truncate">{m.title}</h3>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[m.status as keyof typeof statusColors] || "bg-white/10 text-muted-foreground"}`}>
                              {m.status}
                            </span>
                          </div>
                          {m.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{m.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(m.startDate).toLocaleDateString()} - {new Date(m.dueDate).toLocaleDateString()}
                            </span>
                            {(m.assignedMembers || []).length > 0 && (
                              <span>{(m.assignedMembers || []).length} assigned</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!m.isCompleted && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-emerald-400"
                              onClick={(e) => { e.stopPropagation(); completeMilestone(m.id); }}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
            {activeMilestones.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Target className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No active milestones</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Milestones will appear here from your project groups</p>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>

        {/* Completed Milestones */}
        {completedMilestones.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="text-base font-semibold mb-4">Completed</h2>
            <div className="space-y-2">
              {completedMilestones.map((m) => (
                <Card key={m.id} className="opacity-60">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium line-through">{m.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Completed {m.completedAt ? new Date(m.completedAt).toLocaleDateString() : "recently"}
                        </p>
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
