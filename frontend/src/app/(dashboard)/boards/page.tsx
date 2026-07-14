"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspaceStore } from "@/features/workspace/stores/workspaceStore";
import { KanbanSquare, Loader2 } from "lucide-react";

export default function BoardsPage() {
  const router = useRouter();
  const { workspaces, fetchWorkspaces, isLoading } = useWorkspaceStore();

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
              <KanbanSquare className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Boards</h1>
              <p className="text-muted-foreground">Browse Kanban boards across your workspaces</p>
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="py-20 text-center">
            <KanbanSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">No workspaces yet</h3>
            <p className="mb-4 text-muted-foreground">Create a workspace to start working with boards.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {workspaces.map((ws) => (
              <Card
                key={ws.id}
                className="cursor-pointer transition-all hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-primary/5"
                onClick={() => router.push(`/workspaces/${ws.id}/boards`)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-sm font-bold text-secondary">
                      {ws.name[0].toUpperCase()}
                    </div>
                    <KanbanSquare className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg">{ws.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {ws.description || "No description"}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    View boards →
                  </p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
