"use client";

import { create } from "zustand";
import type { BoardDto, CardDto, BoardWithCardsDto, ActivityDto, BoardMemberDto, LabelDto } from "@/lib/board";
import * as boardApi from "@/lib/board";

interface BoardState {
  boards: BoardDto[];
  currentBoard: BoardWithCardsDto | null;
  activity: ActivityDto[];
  members: BoardMemberDto[];
  selectedCard: CardDto | null;
  isLoading: boolean;
  error: string | null;

  fetchBoards: (workspaceId: string) => Promise<void>;
  fetchBoardFull: (boardId: string) => Promise<void>;
  createBoard: (data: { workspaceId: string; name: string; description?: string }) => Promise<BoardDto>;
  updateBoard: (id: string, data: { name?: string; description?: string }) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;
  createColumn: (data: { boardId: string; name: string; color?: string }) => Promise<void>;
  updateColumn: (id: string, data: { name?: string; color?: string }) => Promise<void>;
  deleteColumn: (id: string) => Promise<void>;
  createCard: (data: { columnId: string; title: string; description?: string }) => Promise<void>;
  updateCard: (id: string, data: { title?: string; description?: string; priority?: string; dueDate?: string }) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  moveCard: (data: { cardId: string; targetColumnId: string; newOrder: number }) => Promise<void>;
  assignCard: (cardId: string, userId?: string) => Promise<void>;
  addLabelToCard: (cardId: string, labelId: string) => Promise<void>;
  removeLabelFromCard: (cardId: string, labelId: string) => Promise<void>;
  addCardComment: (cardId: string, content: string) => Promise<void>;
  fetchActivity: (boardId: string) => Promise<void>;
  fetchMembers: (workspaceId: string) => Promise<void>;
  setSelectedCard: (card: CardDto | null) => void;
  updateLocalColumns: (columns: BoardWithCardsDto["columns"]) => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  currentBoard: null,
  activity: [],
  members: [],
  selectedCard: null,
  isLoading: false,
  error: null,

  fetchBoards: async (workspaceId) => {
    set({ isLoading: true });
    try {
      const boards = await boardApi.getWorkspaceBoards(workspaceId);
      set({ boards, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  fetchBoardFull: async (boardId) => {
    set({ isLoading: true });
    try {
      const data = await boardApi.getBoardFull(boardId);
      set({ currentBoard: data, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  createBoard: async (data) => {
    const board = await boardApi.createBoard(data);
    set((s) => ({ boards: [board, ...s.boards] }));
    return board;
  },

  updateBoard: async (id, data) => {
    await boardApi.updateBoard(id, data);
    set((s) => ({
      boards: s.boards.map((b) => (b.id === id ? { ...b, ...data } : b)),
    }));
  },

  deleteBoard: async (id) => {
    await boardApi.deleteBoard(id);
    set((s) => ({ boards: s.boards.filter((b) => b.id !== id) }));
  },

  createColumn: async (data) => {
    await boardApi.createColumn(data);
    await get().fetchBoardFull(data.boardId);
  },

  updateColumn: async (id, data) => {
    await boardApi.updateColumn(id, data);
    const board = get().currentBoard;
    if (board) {
      set({
        currentBoard: {
          ...board,
          columns: board.columns.map((c) =>
            c.column.id === id ? { ...c, column: { ...c.column, ...data } } : c
          ),
        },
      });
    }
  },

  deleteColumn: async (id) => {
    await boardApi.deleteColumn(id);
    const board = get().currentBoard;
    if (board) {
      set({
        currentBoard: {
          ...board,
          columns: board.columns.filter((c) => c.column.id !== id),
        },
      });
    }
  },

  createCard: async (data) => {
    const card = await boardApi.createCard(data);
    const board = get().currentBoard;
    if (board) {
      set({
        currentBoard: {
          ...board,
          columns: board.columns.map((c) =>
            c.column.id === data.columnId ? { ...c, cards: [...c.cards, card] } : c
          ),
        },
      });
    }
  },

  updateCard: async (id, data) => {
    const card = await boardApi.updateCard(id, data);
    const board = get().currentBoard;
    if (board) {
      set({
        currentBoard: {
          ...board,
          columns: board.columns.map((c) => ({
            ...c,
            cards: c.cards.map((card) => (card.id === id ? { ...card, ...data, priority: data.priority as CardDto["priority"] ?? card.priority } : card)),
          })),
        },
      });
    }
  },

  deleteCard: async (id) => {
    await boardApi.deleteCard(id);
    const board = get().currentBoard;
    if (board) {
      set({
        currentBoard: {
          ...board,
          columns: board.columns.map((c) => ({
            ...c,
            cards: c.cards.filter((card) => card.id !== id),
          })),
        },
      });
    }
  },

  moveCard: async (data) => {
    const board = get().currentBoard;
    if (!board) return;

    // Optimistic update
    let movedCard: CardDto | null = null;
    const newColumns = board.columns.map((col) => {
      const cardIdx = col.cards.findIndex((c) => c.id === data.cardId);
      if (cardIdx !== -1) {
        movedCard = { ...col.cards[cardIdx], columnId: data.targetColumnId, order: data.newOrder };
        return { ...col, cards: col.cards.filter((c) => c.id !== data.cardId) };
      }
      return col;
    });

    if (movedCard) {
      const targetIdx = newColumns.findIndex((c) => c.column.id === data.targetColumnId);
      if (targetIdx !== -1) {
        const targetCards = [...newColumns[targetIdx].cards];
        targetCards.splice(data.newOrder, 0, movedCard!);
        newColumns[targetIdx] = { ...newColumns[targetIdx], cards: targetCards };
      }
    }

    set({ currentBoard: { ...board, columns: newColumns } });

    try {
      await boardApi.moveCard(data);
    } catch {
      await get().fetchBoardFull(board.board.id);
    }
  },

  assignCard: async (cardId, userId) => {
    await boardApi.assignCard({ cardId, userId });
    const board = get().currentBoard;
    if (board) {
      const member = userId ? get().members.find((m) => m.userId === userId) : null;
      set({
        currentBoard: {
          ...board,
          columns: board.columns.map((c) => ({
            ...c,
            cards: c.cards.map((card) =>
              card.id === cardId
                ? { ...card, assigneeId: userId, assigneeName: member?.name ?? undefined, assigneeAvatarUrl: member?.avatarUrl }
                : card
            ),
          })),
        },
      });
    }
  },

  addLabelToCard: async (cardId, labelId) => {
    await boardApi.addLabelToCard({ cardId, labelId });
    const board = get().currentBoard;
    if (board) {
      set({
        currentBoard: {
          ...board,
          columns: board.columns.map((c) => ({
            ...c,
            cards: c.cards.map((card) =>
              card.id === cardId
                ? { ...card, labels: [...card.labels, { id: labelId, name: "", color: "#6366F1" }] }
                : card
            ),
          })),
        },
      });
    }
  },

  removeLabelFromCard: async (cardId, labelId) => {
    await boardApi.removeLabelFromCard({ cardId, labelId });
    const board = get().currentBoard;
    if (board) {
      set({
        currentBoard: {
          ...board,
          columns: board.columns.map((c) => ({
            ...c,
            cards: c.cards.map((card) =>
              card.id === cardId
                ? { ...card, labels: card.labels.filter((l) => l.id !== labelId) }
                : card
            ),
          })),
        },
      });
    }
  },

  addCardComment: async (cardId, content) => {
    await boardApi.addCardComment({ cardId, content });
  },

  fetchActivity: async (boardId) => {
    try {
      const activity = await boardApi.getBoardActivity(boardId);
      set({ activity });
    } catch { set({ activity: [] }); }
  },

  fetchMembers: async (workspaceId) => {
    try {
      const members = await boardApi.getWorkspaceMembers(workspaceId);
      set({ members });
    } catch { set({ members: [] }); }
  },

  setSelectedCard: (card) => set({ selectedCard: card }),
  updateLocalColumns: (columns) => {
    const board = get().currentBoard;
    if (board) set({ currentBoard: { ...board, columns } });
  },
}));
