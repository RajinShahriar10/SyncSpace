"use client";

import { useState, useEffect } from "react";
import { Users, Search, Edit, Trash2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useAdminStore } from "@/features/admin/stores/adminStore";

export default function AdminWorkspacesPage() {
  const {
    workspaces,
    workspacesPagination,
    isLoading,
    fetchWorkspaces,
    updateWorkspace,
    deleteWorkspace,
  } = useAdminStore();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchWorkspaces(debouncedSearch, 1);
  }, [debouncedSearch, fetchWorkspaces]);

  const handleStartEdit = (ws: any) => {
    setEditingId(ws.id);
    setEditForm({ name: ws.name, description: ws.description });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    await updateWorkspace({ id: editingId, ...editForm });
    setEditingId(null);
    fetchWorkspaces(debouncedSearch, workspacesPagination?.page ?? 1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workspace?")) return;
    await deleteWorkspace(id);
    fetchWorkspaces(debouncedSearch, workspacesPagination?.page ?? 1);
  };

  const handlePageChange = (page: number) => {
    fetchWorkspaces(debouncedSearch, page);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-4 sm:px-0">
        <div className="p-2 rounded-xl bg-[#6366F1]/10">
          <Users className="w-5 h-5 text-[#6366F1]" />
        </div>
        <div>
          <h1 className="text-zinc-200 font-semibold text-lg">Workspaces</h1>
          <p className="text-sm text-zinc-500">Manage workspaces and their settings</p>
        </div>
      </div>

      <div className="glass rounded-2xl border border-white/5 p-5 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search workspaces..."
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
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Owner</th>
                  <th className="pb-3 font-medium">Members</th>
                  <th className="pb-3 font-medium">Docs</th>
                  <th className="pb-3 font-medium">Boards</th>
                  <th className="pb-3 font-medium">Created</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workspaces?.map((ws) =>
                  editingId === ws.id ? (
                    <tr key={ws.id} className="border-b border-white/5">
                      <td className="py-3">
                        <input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="bg-white/5 border border-white/5 text-zinc-200 rounded-xl px-3 py-2 text-sm w-full"
                          placeholder="Name"
                        />
                      </td>
                      <td className="py-3 text-zinc-400">{ws.ownerName}</td>
                      <td className="py-3 text-zinc-400">{ws.memberCount}</td>
                      <td className="py-3 text-zinc-400">{ws.documentCount}</td>
                      <td className="py-3 text-zinc-400">{ws.boardCount}</td>
                      <td className="py-3 text-zinc-500">
                        {new Date(ws.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="bg-[#6366F1] hover:bg-[#6366F1]/80 text-white px-3 py-1.5 rounded-xl text-xs"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="bg-white/5 hover:bg-white/10 text-zinc-400 px-3 py-1.5 rounded-xl text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={ws.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3">
                        <div>
                          <p className="text-zinc-200">{ws.name}</p>
                          <p className="text-xs text-zinc-500 mt-0.5 max-w-[200px] truncate">{ws.description}</p>
                        </div>
                      </td>
                      <td className="py-3 text-zinc-400">{ws.ownerName}</td>
                      <td className="py-3 text-zinc-400">{ws.memberCount}</td>
                      <td className="py-3 text-zinc-400">{ws.documentCount}</td>
                      <td className="py-3 text-zinc-400">{ws.boardCount}</td>
                      <td className="py-3 text-zinc-500">
                        {new Date(ws.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStartEdit(ws)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ws.id)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
                {(!workspaces || workspaces.length === 0) && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500">
                      No workspaces found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {workspacesPagination && workspacesPagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-zinc-500">
              Page {workspacesPagination.page} of {workspacesPagination.totalPages} ({workspacesPagination.totalCount} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(workspacesPagination.page - 1)}
                disabled={workspacesPagination.page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={() => handlePageChange(workspacesPagination.page + 1)}
                disabled={workspacesPagination.page >= workspacesPagination.totalPages}
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
