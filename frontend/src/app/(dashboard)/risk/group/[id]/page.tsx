"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRiskStore } from "@/features/risk/stores/riskStore";
import {
  ArrowLeft, Shield, Users, Target, AlertTriangle,
  CheckCircle2, Clock, MessageSquare, Activity, Lightbulb, TrendingUp, Bell
} from "lucide-react";

const riskConfig = {
  High: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", ring: "from-red-500 to-red-600" },
  Medium: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", ring: "from-amber-500 to-amber-600" },
  Low: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", ring: "from-emerald-500 to-emerald-600" },
};

const factorMeta: Record<string, { label: string; icon: typeof Users; max: number; color: string }> = {
  inactiveMembers: { label: "Inactive Members", icon: Users, max: 25, color: "text-amber-400" },
  delayedMilestones: { label: "Delayed Milestones", icon: Target, max: 25, color: "text-red-400" },
  lowContribution: { label: "Low Contribution", icon: TrendingUp, max: 20, color: "text-blue-400" },
  communication: { label: "Communication", icon: MessageSquare, max: 15, color: "text-purple-400" },
  taskBottleneck: { label: "Task Bottleneck", icon: Activity, max: 15, color: "text-orange-400" },
};

export default function GroupRiskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const { groupDetail, isLoading, fetchGroupDetail, runAssessment, alerts, fetchAlerts } = useRiskStore();

  useEffect(() => {
    fetchGroupDetail(groupId);
    fetchAlerts(undefined, undefined, false);
  }, [groupId, fetchGroupDetail, fetchAlerts]);

  const groupAlerts = (alerts || []).filter((a) => a.projectGroupId === groupId);
  const assessment = groupDetail?.assessment;
  const config = assessment ? riskConfig[assessment.riskLevel as keyof typeof riskConfig] || riskConfig.Low : riskConfig.Low;

  if (!assessment) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading risk data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" onClick={() => router.push("/risk/dashboard")} className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" /> Risk Dashboard
          </Button>

          <div className={`relative overflow-hidden rounded-2xl border ${config.border} bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 p-6 sm:p-8`}>
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
              {/* Risk Score Ring */}
              <div className="relative h-20 w-20 shrink-0">
                <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/5" />
                  <motion.path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className={config.color}
                    initial={{ strokeDasharray: "0, 100" }}
                    animate={{ strokeDasharray: `${assessment.overallScore}, 100` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                </svg>
                <span className={`absolute inset-0 flex items-center justify-center text-xl font-bold ${config.color}`}>
                  {assessment.overallScore}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{assessment.groupName}</h1>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.bg} ${config.color}`}>
                    {assessment.riskLevel} Risk
                  </span>
                </div>
                <p className="text-muted-foreground mt-1">{assessment.courseName}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {assessment.memberCount} members</span>
                  <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {assessment.totalMilestones} milestones</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Assessed {new Date(assessment.assessedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={() => runAssessment(groupId)} className="gap-1">
                <Shield className="h-3.5 w-3.5" /> Re-assess
              </Button>
            </div>
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
          </div>
        </motion.div>

        {/* Factor Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Risk Factor Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(assessment.factorScores).map(([key, score]) => {
                  const meta = factorMeta[key];
                  if (!meta) return null;
                  const percent = Math.round((score as number) / meta.max * 100);
                  const Icon = meta.icon;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 shrink-0 ${meta.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{meta.label}</span>
                          <span className="text-xs text-muted-foreground">{score}/{meta.max}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.8 }}
                            className={`h-full rounded-full ${
                              percent >= 60 ? "bg-red-400" : percent >= 30 ? "bg-amber-400" : "bg-emerald-400"
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Members + Milestones */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Members */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" /> Member Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(groupDetail?.members || []).map((m) => (
                    <div key={m.userId} className={`flex items-center justify-between p-2 rounded-lg ${m.isInactive ? "bg-red-500/5 border border-red-500/10" : "bg-white/[0.02]"}`}>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                          {m.name[0]}
                        </div>
                        <div>
                          <p className="text-xs font-medium">{m.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {m.totalContributions} contributions &middot; {m.daysSinceActivity === 999 ? "Never active" : `${m.daysSinceActivity}d ago`}
                          </p>
                        </div>
                      </div>
                      {m.isInactive && <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">Inactive</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Milestones */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" /> Milestone Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(groupDetail?.milestones || []).map((m) => (
                    <div key={m.id} className={`flex items-center justify-between p-2 rounded-lg ${m.isOverdue ? "bg-red-500/5 border border-red-500/10" : m.isCompleted ? "bg-emerald-500/5" : "bg-white/[0.02]"}`}>
                      <div className="flex items-center gap-2">
                        {m.isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        ) : m.isOverdue ? (
                          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <div>
                          <p className="text-xs font-medium">{m.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Due {new Date(m.dueDate).toLocaleDateString()}
                            {m.isOverdue && <span className="text-red-400 ml-1">{m.daysOverdue}d overdue</span>}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        m.isCompleted ? "bg-emerald-500/20 text-emerald-400" :
                        m.isOverdue ? "bg-red-500/20 text-red-400" :
                        "bg-white/10 text-muted-foreground"
                      }`}>{m.status}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Alerts */}
        {groupAlerts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bell className="h-4 w-4" /> Active Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {groupAlerts.map((alert) => {
                    const alertConfig = riskConfig[alert.severity as keyof typeof riskConfig] || riskConfig.Low;
                    return (
                      <div key={alert.id} className={`p-3 rounded-lg ${alertConfig.bg} border ${alertConfig.border}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{alert.title}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${alertConfig.bg} ${alertConfig.color}`}>
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{alert.message}</p>
                        {alert.recommendation && (
                          <div className="flex items-start gap-1.5 mt-2 text-xs text-muted-foreground">
                            <Lightbulb className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" />
                            <span>{alert.recommendation}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
