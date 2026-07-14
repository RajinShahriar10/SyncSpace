"use client";

import { useState, useEffect } from "react";
import { Users, Search, Edit, Trash2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useAdminStore } from "@/features/admin/stores/adminStore";

export default function AdminUsersPage() {
  const {
    users,
    usersPagination,
    isLoading,
    fetchUsers,
    updateUser,
    deleteUser,
  } = useAdminStore();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    status: "Active" as "Active" | "Locked",
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchUsers(debouncedSearch, 1);
  }, [debouncedSearch, fetchUsers]);

  const handleStartEdit = (user: any) => {
    setEditingId(user.id);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    await updateUser({ id: editingId, ...editForm });
    setEditingId(null);
    fetchUsers(debouncedSearch, usersPagination?.page ?? 1);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    await deleteUser(id);
    fetchUsers(debouncedSearch, usersPagination?.page ?? 1);
  };

  const handlePageChange = (page: number) => {
    fetchUsers(debouncedSearch, page);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-4 sm:px-0">
        <div className="p-2 rounded-xl bg-[#6366F1]/10">
          <Users className="w-5 h-5 text-[#6366F1]" />
        </div>
        <div>
          <h1 className="text-zinc-200 font-semibold text-lg">Users</h1>
          <p className="text-sm text-zinc-500">Manage user accounts and permissions</p>
        </div>
      </div>

      <div className="glass rounded-2xl border border-white/5 p-5 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search users..."
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
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-white/5">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Workspaces</th>
                  <th className="pb-3 font-medium">Docs</th>
                  <th className="pb-3 font-medium">Messages</th>
                  <th className="pb-3 font-medium">Created</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user) =>
                  editingId === user.id ? (
                    <tr key={user.id} className="border-b border-white/5">
                      <td className="py-3">
                        <input
                          value={editForm.firstName}
                          onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                          className="bg-white/5 border border-white/5 text-zinc-200 rounded-xl px-3 py-2 text-sm w-full"
                          placeholder="First name"
                        />
                      </td>
                      <td className="py-3">
                        <input
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="bg-white/5 border border-white/5 text-zinc-200 rounded-xl px-3 py-2 text-sm w-full"
                          placeholder="Email"
                        />
                      </td>
                      <td className="py-3">
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value as "Active" | "Locked" })}
                          className="bg-white/5 border border-white/5 text-zinc-200 rounded-xl px-3 py-2 text-sm"
                        >
                          <option value="Active">Active</option>
                          <option value="Locked">Locked</option>
                        </select>
                      </td>
                      <td colSpan={2}>
                        <input
                          value={editForm.lastName}
                          onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                          className="bg-white/5 border border-white/5 text-zinc-200 rounded-xl px-3 py-2 text-sm w-full"
                          placeholder="Last name"
                        />
                      </td>
                      <td colSpan={2}></td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="bg-[#6366F1] hover:bg-[#6366F1]/80 text-white px-3 py-1.5 rounded-xl text-xs"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-white/5 hover:bg-white/10 text-zinc-400 px-3 py-1.5 rounded-xl text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 text-zinc-200">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="py-3 text-zinc-400">{user.email}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            user.status === "Active"
                              ? "bg-[#10B981]/10 text-[#10B981]"
                              : "bg-red-400/10 text-red-400"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 text-zinc-400">{user.workspaceCount}</td>
                      <td className="py-3 text-zinc-400">{user.documentCount}</td>
                      <td className="py-3 text-zinc-400">{user.messageCount}</td>
                      <td className="py-3 text-zinc-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStartEdit(user)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
                {(!users || users.length === 0) && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {usersPagination && usersPagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-zinc-500">
              Page {usersPagination.page} of {usersPagination.totalPages} ({usersPagination.totalCount} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(usersPagination.page - 1)}
                disabled={usersPagination.page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={() => handlePageChange(usersPagination.page + 1)}
                disabled={usersPagination.page >= usersPagination.totalPages}
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
