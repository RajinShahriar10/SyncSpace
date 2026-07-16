"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWorkspaceStore } from "@/features/workspace/stores/workspaceStore";
import { Plus, Users, Settings, Trash2, Folder, Search, Sparkles, ArrowRight } from "lucide-react";

const createSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
});

type CreateFormData = z.infer<typeof createSchema>;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1 },
};

const gradients = [
  "from-violet-500/20 to-indigo-500/5",
  "from-primary/20 to-blue-500/5",
  "from-secondary/20 to-purple-500/5",
  "from-accent/20 to-cyan-500/5",
  "from-emerald-500/20 to-teal-500/5",
  "from-amber-500/20 to-orange-500/5",
  "from-rose-500/20 to-pink-500/5",
];

export default function WorkspacesPage() {
  const router = useRouter();
  const { workspaces, isLoading, fetchWorkspaces, createWorkspace, deleteWorkspace } =
    useWorkspaceStore();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [createError, setCreateError] = useState("");

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
    setCreateError("");
    try {
      const ws = await createWorkspace(data);
      reset();
      setShowCreate(false);
      router.push(`/workspaces/${ws.id}/settings`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to create project. Please try again.";
      setCreateError(typeof msg === "string" ? msg : "Failed to create project.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      await deleteWorkspace(id);
    }
  };

  const filteredWorkspaces = workspaces.filter(
    (ws) =>
      ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">Manage your project workspaces</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </motion.div>

        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="border-primary/20">
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Create New Project</span>
                    </div>
                    <div className="space-y-2">
                      <Input placeholder="Workspace name" {...register("name")} className="h-11" />
                      {errors.name && (
                        <p className="text-xs text-destructive">{errors.name.message}</p>
                      )}
                    </div>
                    <Input placeholder="Description (optional)" {...register("description")} className="h-11" />
                    <div className="flex gap-2">
                      <Button type="submit" disabled={creating} className="gap-2">
                        {creating ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Create
                          </>
                        )}
                      </Button>
                      <Button variant="ghost" onClick={() => { setShowCreate(false); setCreateError(""); }} type="button">
                        Cancel
                      </Button>
                    </div>
                    {createError && (
                      <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                        {createError}
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {workspaces.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workspaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-white/[0.03] border-white/[0.06]"
              />
            </div>
          </motion.div>
        )}

        {isLoading && workspaces.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass h-56 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filteredWorkspaces.length === 0 && workspaces.length > 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
            <Search className="mx-auto mb-4 h-10 w-10 text-muted-foreground/30" />
            <h3 className="mb-2 text-lg font-medium">No matching projects</h3>
            <p className="text-muted-foreground">Try a different search term.</p>
          </motion.div>
        ) : workspaces.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
            <div className="relative mx-auto mb-6 h-20 w-20">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 blur-xl" />
              <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-white/[0.06]">
                <Folder className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="mb-2 text-lg font-medium">No projects yet</h3>
            <p className="mb-6 text-muted-foreground max-w-sm mx-auto">
              Create your first project workspace to start collaborating.
            </p>
            <Button onClick={() => setShowCreate(true)} className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          </motion.div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredWorkspaces.map((ws, idx) => (
              <motion.div key={ws.id} variants={item} layout>
                <Card
                  className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-0.5"
                  onClick={() => router.push(`/workspaces/${ws.id}`)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradients[idx % gradients.length]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <CardContent className="relative p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 text-lg font-bold text-primary group-hover:scale-110 transition-transform duration-300">
                        {ws.name[0].toUpperCase()}
                      </div>
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
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
                          className="h-8 w-8"
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
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(ws.id, ws.name);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">{ws.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {ws.description || "No description"}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {ws.memberCount} {ws.memberCount === 1 ? "member" : "members"}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[10px] font-medium uppercase tracking-wider">
                          {ws.plan}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
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
