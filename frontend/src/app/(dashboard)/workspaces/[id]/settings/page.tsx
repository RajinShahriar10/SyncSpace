"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWorkspaceStore } from "@/features/workspace/stores/workspaceStore";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

const editSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().regex(/^[a-z0-9-]*$/, "Only lowercase, numbers, hyphens").optional().or(z.literal("")),
  description: z.string().optional(),
});

type EditFormData = z.infer<typeof editSchema>;

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  const { currentWorkspace, fetchWorkspace, updateWorkspace, deleteWorkspace, isLoading } =
    useWorkspaceStore();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  });

  const watchName = watch("name");

  useEffect(() => {
    fetchWorkspace(workspaceId);
  }, [workspaceId, fetchWorkspace]);

  useEffect(() => {
    if (currentWorkspace) {
      reset({
        name: currentWorkspace.name,
        slug: currentWorkspace.slug,
        description: currentWorkspace.description || "",
      });
    }
  }, [currentWorkspace, reset]);

  const onSubmit = async (data: EditFormData) => {
    setSaving(true);
    try {
      await updateWorkspace(workspaceId, {
        name: data.name,
        slug: data.slug || undefined,
        description: data.description,
      });
    } catch {
      // error in store
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (currentWorkspace && confirm(`Delete "${currentWorkspace.name}"? This cannot be undone.`)) {
      await deleteWorkspace(workspaceId);
      router.push("/workspaces");
    }
  };

  if (!currentWorkspace && isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-8 px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Button
            variant="ghost"
            onClick={() => router.push("/workspaces")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Project Settings</h1>
          <p className="text-muted-foreground">Manage your project details</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>Update your project name and description</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input {...register("name")} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Slug</label>
                  <Input {...register("slug")} placeholder="project-slug" />
                  {watchName && (
                    <p className="text-xs text-muted-foreground">
                      URL: /workspaces/{(watchName || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}
                    </p>
                  )}
                  {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input {...register("description")} placeholder="What's this project about?" />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Permanently delete this project and all its data</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleDelete} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Project
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
