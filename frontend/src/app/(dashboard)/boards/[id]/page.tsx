"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { KanbanBoard } from "@/components/boards/kanban-board";
import { CardDetailModal } from "@/components/boards/card-detail-modal";
import { ActivityPanel } from "@/components/boards/activity-panel";
import { useBoardStore } from "@/features/boards/stores/boardStore";
import { ChevronLeft, History, Settings } from "lucide-react";

export default function BoardDetailPage() {
  const router = useRouter();
  const params = useParams();
  const boardId = params.id as string;
  const { currentBoard, fetchBoardFull, selectedCard, setSelectedCard, fetchMembers } = useBoardStore();
  const [showActivity, setShowActivity] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoardFull(boardId).then(() => setLoading(false));
    if (currentBoard?.board.workspaceId) {
      fetchMembers(currentBoard.board.workspaceId);
    }
  }, [boardId, fetchBoardFull, fetchMembers, currentBoard?.board.workspaceId]);

  if (loading || !currentBoard) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-white/[0.06] px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/workspaces/${currentBoard.board.workspaceId}`)}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
              <span className="text-xs font-bold text-primary">B</span>
            </div>
            <h1 className="text-lg font-semibold">{currentBoard.board.name}</h1>
          </div>
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {currentBoard.columns.reduce((sum, c) => sum + c.cards.length, 0)} cards
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowActivity(!showActivity)}
            className={`rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground ${
              showActivity ? "bg-white/[0.06] text-foreground" : ""
            }`}
          >
            <History className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Board content */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto py-4">
          <KanbanBoard boardId={boardId} />
        </div>

        {showActivity && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="overflow-hidden border-l border-white/[0.06]"
          >
            <ActivityPanel boardId={boardId} onClose={() => setShowActivity(false)} />
          </motion.div>
        )}
      </div>

      {/* Card detail modal */}
      {selectedCard && <CardDetailModal />}
    </div>
  );
}
