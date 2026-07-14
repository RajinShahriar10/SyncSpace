"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWorkspaceStore } from "@/features/workspace/stores/workspaceStore";
import { Plus, Users, Settings, Trash2, Folder } from "lucide-react";

const createSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
});

type CreateFormData = z.infer<typeof createSchema>;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function WorkspacesPage() {
  const router = useRouter();
  const { workspaces, isLoading, fetchWorkspaces, createWorkspace, deleteWorkspace } =
    useWorkspaceStore();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
  });

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const onCreate = async (data: CreateFormData) => {
    setCreating(true);
    try {
      const ws = await createWorkspace(data);
      reset();
      setShowCreate(false);
      router.push(`/workspaces/${ws.id}/settings`);
    } catch {
      // error in store
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      await deleteWorkspace(id);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Workspaces</h1>
            <p className="text-muted-foreground">Manage your team workspaces</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Workspace
          </Button>
        </motion.div>

        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Create Workspace</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
                    <div className="space-y-2">
                      <Input placeholder="Workspace name" {...register("name")} />
                      {errors.name && (
                        <p className="text-xs text-destructive">{errors.name.message}</p>
                      )}
                    </div>
                    <Input placeholder="Description (optional)" {...register("description")} />
                    <div className="flex gap-2">
                      <Button type="submit" disabled={creating}>
                        {creating ? "Creating..." : "Create"}
                      </Button>
                      <Button variant="ghost" onClick={() => setShowCreate(false)} type="button">
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading && workspaces.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass h-48 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
            <Folder className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">No workspaces yet</h3>
            <p className="mb-4 text-muted-foreground">Create your first workspace to get started.</p>
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Workspace
            </Button>
          </motion.div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {workspaces.map((ws) => (
              <motion.div key={ws.id} variants={item} layout>
                <Card
                  className="group cursor-pointer transition-all hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-primary/5"
                  onClick={() => router.push(`/workspaces/${ws.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{ws.name}</CardTitle>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {ws.description || "No description"}
                        </p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                        {ws.name[0].toUpperCase()}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {ws.memberCount} members
                        </span>
                        <span className="capitalize">{ws.plan}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/workspaces/${ws.id}/members`);
                          }}
                        >
                          <Users className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/workspaces/${ws.id}/settings`);
                          }}
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(ws.id, ws.name);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
