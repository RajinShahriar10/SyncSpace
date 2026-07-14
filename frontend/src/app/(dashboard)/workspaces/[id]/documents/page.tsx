"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDocumentStore } from "@/features/documents/stores/documentStore";
import { useWorkspaceStore } from "@/features/workspace/stores/workspaceStore";
import { Plus, FileText, Clock, User, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function WorkspaceDocumentsPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  const { documents, fetchWorkspaceDocuments, isLoading, createDocument, deleteDocument } =
    useDocumentStore();
  const { currentWorkspace, fetchWorkspace } = useWorkspaceStore();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchWorkspaceDocuments(workspaceId);
    if (!currentWorkspace || currentWorkspace.id !== workspaceId) {
      fetchWorkspace(workspaceId);
    }
  }, [workspaceId, fetchWorkspaceDocuments, fetchWorkspace, currentWorkspace]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const doc = await createDocument({ workspaceId, title: "Untitled" });
      router.push(`/documents/${doc.id}`);
    } catch {
      setCreating(false);
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Documents</h1>
            <p className="text-muted-foreground">
              {currentWorkspace?.name} &middot; {documents.length} documents
            </p>
          </div>

          <Button onClick={handleCreate} disabled={creating} className="gap-2">
            <Plus className="h-4 w-4" />
            {creating ? "Creating..." : "New Document"}
          </Button>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : documents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.06] py-20"
          >
            <FileText className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <h3 className="text-lg font-medium">No documents yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first document to get started.
            </p>
            <Button onClick={handleCreate} disabled={creating} className="mt-6 gap-2">
              <Plus className="h-4 w-4" />
              Create Document
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card
                  className="group cursor-pointer transition-all hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-primary/5"
                  onClick={() => router.push(`/documents/${doc.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base font-medium line-clamp-1">
                        {doc.title || "Untitled"}
                      </CardTitle>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this document?")) {
                            deleteDocument(doc.id);
                          }
                        }}
                        className="rounded-lg p-1 text-muted-foreground opacity-0 transition-all hover:bg-white/[0.06] hover:text-red-400 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm text-muted-foreground/70">
                      {doc.content?.slice(0, 150) || "Empty document"}
                    </p>
                    <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground/50">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {doc.authorName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
