"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Users, FileText, MessageSquare, CheckSquare, HardDrive, BarChart3, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminStore } from "@/features/admin/stores/adminStore";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function AdminPage() {
  const { overview, isLoading, fetchOverview } = useAdminStore();

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
              <p className="text-muted-foreground">Platform administration</p>
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <motion.div variants={item}>
                <Card className="hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-primary/5 cursor-pointer group">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Users</CardTitle>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                      <Users className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{overview?.totalUsers ?? 0}</div>
                    <p className="text-xs text-muted-foreground">{overview?.activeUsers ?? 0} active &middot; +{overview?.usersLast30Days ?? 0} last 30d</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-primary/5 cursor-pointer group">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Workspaces</CardTitle>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                      <BarChart3 className="h-5 w-5 text-violet-400 group-hover:scale-110 transition-transform" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{overview?.totalWorkspaces ?? 0}</div>
                    <p className="text-xs text-muted-foreground">Total workspaces</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-primary/5 cursor-pointer group">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Documents</CardTitle>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                      <FileText className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{overview?.totalDocuments ?? 0}</div>
                    <p className="text-xs text-muted-foreground">+{overview?.documentsLast30Days ?? 0} last 30d</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-primary/5 cursor-pointer group">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Messages</CardTitle>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                      <MessageSquare className="h-5 w-5 text-amber-400 group-hover:scale-110 transition-transform" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{overview?.totalMessages ?? 0}</div>
                    <p className="text-xs text-muted-foreground">+{overview?.messagesLast30Days ?? 0} last 30d</p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <motion.div variants={item}>
                <Card className="hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-primary/5 cursor-pointer group">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Tasks</CardTitle>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10">
                      <CheckSquare className="h-5 w-5 text-rose-400 group-hover:scale-110 transition-transform" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{overview?.totalTasks ?? 0}</div>
                    <p className="text-xs text-muted-foreground">Total tasks</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-primary/5 cursor-pointer group">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Files</CardTitle>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10">
                      <HardDrive className="h-5 w-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{overview?.totalFiles ?? 0}</div>
                    <p className="text-xs text-muted-foreground">Uploaded files</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-primary/5 cursor-pointer group">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Storage</CardTitle>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
                      <HardDrive className="h-5 w-5 text-orange-400 group-hover:scale-110 transition-transform" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatBytes(overview?.totalStorageBytes ?? 0)}</div>
                    <p className="text-xs text-muted-foreground">Total storage used</p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
