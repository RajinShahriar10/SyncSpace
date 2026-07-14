"use client";

import { useState, useEffect } from "react";
import { FileText, Search, Trash2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useAdminStore } from "@/features/admin/stores/adminStore";

export default function AdminDocumentsPage() {
  const {
    documents,
    documentsPagination,
    isLoading,
    fetchDocuments,
    deleteDocument,
  } = useAdminStore();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchDocuments(debouncedSearch, 1);
  }, [debouncedSearch, fetchDocuments]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    await deleteDocument(id);
    fetchDocuments(debouncedSearch, documentsPagination?.page ?? 1);
  };

  const handlePageChange = (page: number) => {
    fetchDocuments(debouncedSearch, page);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-4 sm:px-0">
        <div className="p-2 rounded-xl bg-[#6366F1]/10">
          <FileText className="w-5 h-5 text-[#6366F1]" />
        </div>
        <div>
          <h1 className="text-zinc-200 font-semibold text-lg">Documents</h1>
          <p className="text-sm text-zinc-500">Browse and manage all documents across workspaces</p>
        </div>
      </div>

      <div className="glass rounded-2xl border border-white/5 p-5 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/5 text-zinc-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#6366F1]/50"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-white/5">
                  <th className="pb-3 font-medium">Title</th>
                  <th className="pb-3 font-medium">Author</th>
                  <th className="pb-3 font-medium">Workspace</th>
                  <th className="pb-3 font-medium">Words</th>
                  <th className="pb-3 font-medium">Version</th>
                  <th className="pb-3 font-medium">Updated</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents?.map((doc) => (
                  <tr key={doc.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-3 text-zinc-200">{doc.title}</td>
                    <td className="py-3 text-zinc-400">{doc.authorName}</td>
                    <td className="py-3 text-zinc-400">{doc.workspaceName}</td>
                    <td className="py-3 text-zinc-400">{doc.wordCount.toLocaleString()}</td>
                    <td className="py-3 text-zinc-400">v{doc.currentVersion}</td>
                    <td className="py-3 text-zinc-500">
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {(!documents || documents.length === 0) && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500">
                      No documents found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {documentsPagination && documentsPagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-zinc-500">
              Page {documentsPagination.page} of {documentsPagination.totalPages} ({documentsPagination.totalCount} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(documentsPagination.page - 1)}
                disabled={documentsPagination.page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={() => handlePageChange(documentsPagination.page + 1)}
                disabled={documentsPagination.page >= documentsPagination.totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
