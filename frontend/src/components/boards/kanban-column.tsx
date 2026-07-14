"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBoardStore } from "@/features/boards/stores/boardStore";
import { KanbanCard } from "./kanban-card";
import type { ColumnDto, CardDto } from "@/lib/board";
import { Plus, MoreHorizontal, Pencil, Trash2, X, Check } from "lucide-react";

interface KanbanColumnProps {
  column: ColumnDto;
  cards: CardDto[];
  isDragOver: boolean;
  onDragStart: (cardId: string, sourceColumnId: string) => void;
  onDragOver: (e: React.DragEvent, columnId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, targetColumnId: string, targetIndex: number) => void;
}

export function KanbanColumn({
  column,
  cards,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: KanbanColumnProps) {
  const { createCard, updateColumn, deleteColumn } = useBoardStore();
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState(column.name);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleAddCard = async () => {
    if (!newCardTitle.trim()) return;
    await createCard({ columnId: column.id, title: newCardTitle.trim() });
    setNewCardTitle("");
  };

  const handleRename = async () => {
    if (editName.trim() && editName !== column.name) {
      await updateColumn(column.id, { name: editName.trim() });
    }
    setEditingName(false);
  };

  const handleDelete = async () => {
    if (confirm(`Delete column "${column.name}" and all its cards?`)) {
      await deleteColumn(column.id);
    }
    setShowMenu(false);
  };

  return (
    <div
      className={`flex w-[280px] flex-col rounded-xl border transition-colors ${
        isDragOver ? "border-primary/40 bg-primary/[0.03]" : "border-white/[0.06] bg-white/[0.02]"
      }`}
      onDragOver={(e) => onDragOver(e, column.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, column.id, cards.length)}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          {column.color && (
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: column.color }} />
          )}
          {editingName ? (
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") { setEditName(column.name); setEditingName(false); }
              }}
              onBlur={handleRename}
              className="bg-transparent text-sm font-semibold text-foreground outline-none"
              autoFocus
            />
          ) : (
            <h3 className="text-sm font-semibold text-foreground">{column.name}</h3>
          )}
          <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {cards.length}
          </span>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-white/[0.06] bg-surface py-1 shadow-xl"
            >
              <button
                onClick={() => { setEditingName(true); setShowMenu(false); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-white/[0.06]"
              >
                <Pencil className="h-3 w-3" /> Rename
              </button>
              <button
                onClick={handleDelete}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-white/[0.06]"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-2 px-2 pb-2 min-h-[40px]">
        <AnimatePresence mode="popLayout">
          {cards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: i * 0.02 }}
              draggable
              onDragStart={() => onDragStart(card.id, column.id)}
              onDrop={(e) => {
                e.stopPropagation();
                onDrop(e, column.id, i);
              }}
            >
              <KanbanCard card={card} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add card */}
      <div className="px-2 pb-2">
        {addingCard ? (
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2">
            <input
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCard();
                if (e.key === "Escape") { setNewCardTitle(""); setAddingCard(false); }
              }}
              placeholder="Card title"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/40"
              autoFocus
            />
            <div className="mt-2 flex gap-1">
              <button
                onClick={handleAddCard}
                className="rounded-md bg-primary px-2 py-0.5 text-[11px] font-medium text-white hover:bg-primary/80"
              >
                Add
              </button>
              <button
                onClick={() => { setAddingCard(false); setNewCardTitle(""); }}
                className="rounded-md px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-white/[0.06]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingCard(true)}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Add card
          </button>
        )}
      </div>
    </div>
  );
}
