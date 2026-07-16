"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRiskStore } from "@/features/risk/stores/riskStore";
import {
  Shield, AlertTriangle, CheckCircle2, Clock, Users, Target,
  MessageSquare, Activity, RefreshCw, ChevronRight, Eye, EyeOff,
  TrendingUp, BarChart3, Bell, Lightbulb, X, Filter
} from "lucide-react";

const riskConfig = {
  High: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", ring: "from-red-500 to-red-600" },
  Medium: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", ring: "from-amber-500 to-amber-600" },
  Low: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", ring: "from-emerald-500 to-emerald-600" },
};

const factorIcons: Record<string, typeof Users> = {
  InactiveMembers: Users,
  DelayedMilestones: Target,
  LowContribution: TrendingUp,
  CommunicationBreakdown: MessageSquare,
  TaskBottleneck: Activity,
};

const factorLabels: Record<string, string> = {
  InactiveMembers: "Inactive Members",
  DelayedMilestones: "Delayed Milestones",
  LowContribution: "Low Contribution",
  CommunicationBreakdown: "Communication",
  TaskBottleneck: "Task Bottleneck",
};

export default function RiskDashboardPage() {
  const router = useRouter();
  const {
    dashboard, assessments, alerts, isLoading,
    fetchDashboard, fetchAssessments, fetchAlerts,
    runAssessment, acknowledgeAlert, autoRefresh,
    filterRiskLevel, setFilterRiskLevel,
  } = useRiskStore();

  const [activeTab, setActiveTab] = useState<"overview" | "groups" | "alerts">("overview");
  const [refreshInterval, setRefreshInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  const startAutoRefresh = useCallback(() => {
    if (refreshInterval) clearInterval(refreshInterval);
    const interval = setInterval(() => {
      autoRefresh();
    }, 30000);
    setRefreshInterval(interval);
  }, [refreshInterval, autoRefresh]);

  useEffect(() => {
    fetchDashboard();
    fetchAssessments();
    fetchAlerts(undefined, undefined, false);
    startAutoRefresh();
    return () => { if (refreshInterval) clearInterval(refreshInterval); };
  }, []);

  const handleAssessAll = async () => {
    for (const a of (assessments || [])) {
      try { await runAssessment(a.projectGroupId); } catch {}
    }
    fetchDashboard();
    fetchAssessments();
    fetchAlerts(undefined, undefined, false);
  };

  const filteredAssessments = filterRiskLevel
    ? (assessments || []).filter((a) => a.riskLevel === filterRiskLevel)
    : (assessments || []);

  const highRisk = filteredAssessments.filter((a) => a.riskLevel === "High");
  const mediumRisk = filteredAssessments.filter((a) => a.riskLevel === "Medium");
  const lowRisk = filteredAssessments.filter((a) => a.riskLevel === "Low");

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Risk Detection</h1>
            <p className="text-muted-foreground mt-1">Early warning system for struggling groups</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { fetchDashboard(); fetchAssessments(); fetchAlerts(undefined, undefined, false); }} className="gap-1">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button size="sm" onClick={handleAssessAll} className="gap-1">
              <Shield className="h-3.5 w-3.5" /> Assess All
            </Button>
          </div>
        </motion.div>

        {/* Overview Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="border-red-500/20">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-400">{dashboard?.highRiskGroups ?? 0}</p>
              <p className="text-xs text-muted-foreground">High Risk</p>
            </CardContent>
          </Card>
          <Card className="border-amber-500/20">
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 text-amber-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-400">{dashboard?.mediumRiskGroups ?? 0}</p>
              <p className="text-xs text-muted-foreground">Medium Risk</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/20">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-emerald-400">{dashboard?.lowRiskGroups ?? 0}</p>
              <p className="text-xs text-muted-foreground">Low Risk</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Bell className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{dashboard?.totalAlerts ?? 0}</p>
              <p className="text-xs text-muted-foreground">Active Alerts</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Health Score + Milestones */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Overall Health Score</p>
                <p className="text-lg font-bold text-primary">{dashboard?.overallHealth ?? 0}%</p>
              </div>
              <div className="h-3 rounded-full bg-surface-sunken overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${dashboard?.overallHealth ?? 0}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500"
                />
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                <span>Critical</span><span>Poor</span><span>Fair</span><span>Good</span><span>Excellent</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Milestone Status</p>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold">{dashboard?.totalMilestones ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Total Milestones</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-400">{dashboard?.delayedMilestones ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Delayed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex gap-1 mb-4 border-b border-border-subtle">
            {(["overview", "groups", "alerts"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab} {tab === "alerts" && alerts.length > 0 && (
                  <span className="ml-1 text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">{alerts.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Risk Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {(["High", "Medium", "Low"] as const).map((level) => {
                      const count = level === "High" ? highRisk.length : level === "Medium" ? mediumRisk.length : lowRisk.length;
                      const total = filteredAssessments.length;
                      const percent = total > 0 ? Math.round(count / total * 100) : 0;
                      const config = riskConfig[level];
                      return (
                        <div key={level} className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`h-3 w-3 rounded-full bg-gradient-to-r ${config.ring}`} />
                            <span className={`text-xs font-medium ${config.color}`}>{level}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-surface-sunken overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 0.8, delay: 0.1 }}
                              className={`h-full rounded-full bg-gradient-to-r ${config.ring}`}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">{percent}%</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Top Alerts */}
              {alerts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Bell className="h-4 w-4" /> Latest Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {alerts.slice(0, 5).map((alert) => {
                        const config = riskConfig[alert.severity as keyof typeof riskConfig] || riskConfig.Low;
                        const Icon = factorIcons[alert.factor] || AlertTriangle;
                        return (
                          <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg ${config.bg} border ${config.border}`}>
                            <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.color}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{alert.title}</p>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${config.bg} ${config.color}`}>
                                  {alert.severity}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{alert.groupName}</p>
                              {alert.recommendation && (
                                <div className="flex items-start gap-1.5 mt-2 text-xs text-muted-foreground">
                                  <Lightbulb className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" />
                                  <span>{alert.recommendation}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Groups Tab */}
          {activeTab === "groups" && (
            <div className="space-y-4">
              {/* Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Filter:</span>
                {[
                  { label: "All", value: null },
                  { label: "High", value: "High" },
                  { label: "Medium", value: "Medium" },
                  { label: "Low", value: "Low" },
                ].map((f) => (
                  <button
                    key={f.label}
                    onClick={() => setFilterRiskLevel(f.value)}
                    className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                      filterRiskLevel === f.value
                        ? "bg-primary/20 text-primary"
                        : "bg-surface-sunken text-muted-foreground hover:bg-surface-hover"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
                <span className="text-xs text-muted-foreground ml-auto">{filteredAssessments.length} groups</span>
              </div>

              {/* Group List */}
              <div className="space-y-2">
                {filteredAssessments.map((a, i) => {
                  const config = riskConfig[a.riskLevel as keyof typeof riskConfig] || riskConfig.Low;
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.03 * i }}
                    >
                      <Card className={`cursor-pointer transition-all hover:bg-surface-hover ${config.border} border`} onClick={() => router.push(`/risk/group/${a.projectGroupId}`)}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Risk Score Ring */}
                            <div className="relative h-12 w-12 shrink-0">
                              <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/5" />
                                <motion.path
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  className={config.color}
                                  initial={{ strokeDasharray: "0, 100" }}
                                  animate={{ strokeDasharray: `${a.overallScore}, 100` }}
                                  transition={{ duration: 1, delay: 0.1 * i }}
                                />
                              </svg>
                              <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${config.color}`}>
                                {a.overallScore}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-medium truncate">{a.groupName}</h3>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${config.bg} ${config.color}`}>
                                  {a.riskLevel}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{a.courseName}</p>
                              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {a.memberCount} members</span>
                                {a.inactiveMemberCount > 0 && <span className="text-amber-400">{a.inactiveMemberCount} inactive</span>}
                                {a.delayedMilestoneCount > 0 && <span className="text-red-400">{a.delayedMilestoneCount} delayed</span>}
                                {a.alertCount > 0 && <span className="text-primary">{a.alertCount} alerts</span>}
                              </div>
                            </div>

                            {/* Factor Bars */}
                            <div className="hidden sm:flex gap-1 shrink-0">
                              {Object.entries(a.factorScores).map(([key, score]) => {
                                const maxScore = key === "inactiveMembers" || key === "delayedMilestones" ? 25 : key === "lowContribution" ? 20 : 15;
                                const percent = Math.round((score as number) / maxScore * 100);
                                return (
                                  <div key={key} className="text-center">
                                    <div className="h-8 w-1.5 rounded-full bg-surface-sunken overflow-hidden">
                                      <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${percent}%` }}
                                        transition={{ duration: 0.6 }}
                                        className={`w-full rounded-full ${
                                          percent >= 60 ? "bg-red-400" : percent >= 30 ? "bg-amber-400" : "bg-emerald-400"
                                        }`}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
                {filteredAssessments.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Shield className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No risk (assessments || []) found</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Click &quot;Assess All&quot; to run risk analysis</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === "alerts" && (
            <div className="space-y-4">
              {/* Alert Filters */}
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Severity:</span>
                {["All", "High", "Medium", "Low"].map((level) => (
                  <button
                    key={level}
                    onClick={() => fetchAlerts(undefined, level === "All" ? undefined : level, false)}
                    className="text-xs px-2.5 py-1 rounded-full bg-surface-sunken text-muted-foreground hover:bg-surface-hover transition-colors"
                  >
                    {level}
                  </button>
                ))}
              </div>

              {/* Alert List */}
              <div className="space-y-2">
                {alerts.map((alert, i) => {
                  const config = riskConfig[alert.severity as keyof typeof riskConfig] || riskConfig.Low;
                  const Icon = factorIcons[alert.factor] || AlertTriangle;
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.03 * i }}
                    >
                      <Card className={`${config.border} border`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`h-8 w-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                              <Icon className={`h-4 w-4 ${config.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-medium">{alert.title}</h3>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${config.bg} ${config.color}`}>
                                  {alert.severity}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-sunken text-muted-foreground">
                                  {factorLabels[alert.factor] || alert.factor}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                              <p className="text-xs text-muted-foreground/60 mt-0.5">{alert.groupName} &middot; {alert.courseName}</p>
                              {alert.recommendation && (
                                <div className="flex items-start gap-1.5 mt-2 p-2 rounded-md bg-amber-500/5 border border-amber-500/10">
                                  <Lightbulb className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                                  <p className="text-xs text-amber-200/80">{alert.recommendation}</p>
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() => acknowledgeAlert(alert.id, "current-user")}
                            >
                              <EyeOff className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
                {alerts.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No active alerts</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">All groups are performing well</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
