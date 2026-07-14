"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBoardStore } from "@/features/boards/stores/boardStore";
import { KanbanColumn } from "./kanban-column";
import { Plus, X } from "lucide-react";

export function KanbanBoard({ boardId }: { boardId: string }) {
  const { currentBoard, createColumn, moveCard } = useBoardStore();
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const dragData = useRef<{ cardId: string; sourceColumnId: string } | null>(null);

  const columns = currentBoard?.columns ?? [];

  const handleDragStart = useCallback((cardId: string, sourceColumnId: string) => {
    dragData.current = { cardId, sourceColumnId };
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetColumnId: string, targetIndex: number) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!dragData.current) return;
    const { cardId, sourceColumnId } = dragData.current;

    let newOrder = targetIndex;
    if (sourceColumnId === targetColumnId) {
      const col = columns.find((c) => c.column.id === targetColumnId);
      if (col) {
        const oldIdx = col.cards.findIndex((c) => c.id === cardId);
        if (oldIdx < targetIndex) newOrder = targetIndex;
      }
    }

    moveCard({ cardId, targetColumnId, newOrder });
    dragData.current = null;
  }, [columns, moveCard]);

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) return;
    await createColumn({ boardId, name: newColumnName.trim() });
    setNewColumnName("");
    setAddingColumn(false);
  };

  return (
    <div className="flex h-full gap-4 overflow-x-auto px-6 pb-4">
      <AnimatePresence mode="popLayout">
        {columns.map((col, i) => (
          <motion.div
            key={col.column.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: i * 0.05 }}
            className="flex-shrink-0"
          >
            <KanbanColumn
              column={col.column}
              cards={col.cards}
              isDragOver={dragOverColumn === col.column.id}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add column */}
      <div className="flex-shrink-0">
        {addingColumn ? (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 280 }}
            className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3"
          >
            <input
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddColumn();
                if (e.key === "Escape") setAddingColumn(false);
              }}
              placeholder="Column name"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/40"
              autoFocus
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleAddColumn}
                className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-primary/80"
              >
                Add
              </button>
              <button
                onClick={() => { setAddingColumn(false); setNewColumnName(""); }}
                className="rounded-lg px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-white/[0.06]"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        ) : (
          <button
            onClick={() => setAddingColumn(true)}
            className="flex h-10 w-[280px] items-center gap-2 rounded-xl border border-dashed border-white/[0.06] px-3 text-sm text-muted-foreground transition-colors hover:border-white/[0.12] hover:bg-white/[0.03] hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            Add column
          </button>
        )}
      </div>
    </div>
  );
}
