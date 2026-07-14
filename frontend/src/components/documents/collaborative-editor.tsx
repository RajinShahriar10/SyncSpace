"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import * as signalR from "@microsoft/signalr";
import { useDocumentStore } from "@/features/documents/stores/documentStore";
import { PresenceAvatars } from "./presence-avatars";
import { CursorsOverlay } from "./cursors-overlay";
import { VersionHistoryPanel } from "./version-history-panel";
import { CommentsSidebar } from "./comments-sidebar";
import { getAccessToken } from "@/lib/auth";
import {
  Save,
  History,
  MessageSquare,
  ChevronLeft,
  Users,
  MoreHorizontal,
  Trash2,
  Sparkles,
} from "lucide-react";
import AIAssistantSidebar from "@/features/ai/components/AIAssistantSidebar";
import { useAIStore } from "@/features/ai/stores/aiStore";

interface CursorData {
  userId: string;
  position: number;
  selectionEnd: number;
  userName: string;
  color: string;
}

interface TypingData {
  userId: string;
  connectionId: string;
  isTyping: boolean;
}

export function CollaborativeEditor({ documentId }: { documentId: string }) {
  const router = useRouter();
  const {
    currentDocument,
    fetchDocument,
    updateDocument,
    onlineUsers,
    setOnlineUsers,
    updateLocalDocument,
    isSaving,
    lastSaved,
    fetchVersions,
    fetchComments,
  } = useDocumentStore();
  const { openSidebar } = useAIStore();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showVersions, setShowVersions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [cursors, setCursors] = useState<Record<string, CursorData>>({});
  const [typingUsers, setTypingUsers] = useState<TypingData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Load document
  useEffect(() => {
    fetchDocument(documentId);
    fetchVersions(documentId);
    fetchComments(documentId);
  }, [documentId, fetchDocument, fetchVersions, fetchComments]);

  // Sync local state when document loads
  useEffect(() => {
    if (currentDocument) {
      setTitle(currentDocument.title);
      setContent(currentDocument.content);
    }
  }, [currentDocument?.id]);

  // SignalR connection
  useEffect(() => {
    const hubUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")
      .replace("/api", "")
      .replace("http", "wss") + "/hubs/documents";

    const httpUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")
      .replace("/api", "") + "/hubs/documents";

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(httpUrl, {
        accessTokenFactory: () => getAccessToken() || "",
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    connection.onreconnecting(() => setConnectionStatus("connecting"));
    connection.onreconnected(() => {
      setConnectionStatus("connected");
      connection.invoke("JoinDocument", documentId);
    });
    connection.onclose(() => setConnectionStatus("disconnected"));

    connection.on("Connected", () => {});

    connection.on("UserJoined", (user: { userId: string; userName: string; avatarUrl?: string; connectionId: string }) => {
      setOnlineUsers([...useDocumentStore.getState().onlineUsers, {
        ...user,
        lastActive: new Date().toISOString(),
      }]);
    });

    connection.on("UserLeft", (connectionId: string) => {
      setOnlineUsers(
        useDocumentStore.getState().onlineUsers.filter((u) => u.connectionId !== connectionId)
      );
      setCursors((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          if (next[key].userId === connectionId) delete next[key];
        });
        return next;
      });
    });

    connection.on("PresenceUpdate", (users: Array<{ userId: string; userName: string; avatarUrl?: string; connectionId: string; lastActive: string }>) => {
      setOnlineUsers(users);
    });

    connection.on("ContentUpdate", (data: { content: string; title: string; updatedBy: string; timestamp: string }) => {
      if (data.updatedBy !== connection.connectionId) {
        setContent(data.content);
        setTitle(data.title);
        updateLocalDocument({ content: data.content, title: data.title });
      }
    });

    connection.on("CursorPosition", (data: CursorData) => {
      setCursors((prev) => ({ ...prev, [data.userId]: data }));
    });

    connection.on("TypingIndicator", (data: TypingData) => {
      if (data.isTyping) {
        setTypingUsers((prev) => {
          const exists = prev.some((t) => t.userId === data.userId);
          return exists ? prev : [...prev, data];
        });
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((t) => t.userId !== data.userId));
        }, 3000);
      } else {
        setTypingUsers((prev) => prev.filter((t) => t.userId !== data.userId));
      }
    });

    connection.start()
      .then(() => {
        setConnectionStatus("connected");
        return connection.invoke("JoinDocument", documentId);
      })
      .catch(() => setConnectionStatus("disconnected"));

    return () => {
      connection.stop();
      connectionRef.current = null;
    };
  }, [documentId, setOnlineUsers, updateLocalDocument]);

  // Auto-save
  const scheduleSave = useCallback(
    (newTitle: string, newContent: string) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        updateDocument(documentId, { title: newTitle, content: newContent });
        if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
          connectionRef.current.invoke("SendContentUpdate", documentId, newContent, newTitle);
          connectionRef.current.invoke("SendSaved", documentId, (currentDocument?.currentVersion ?? 0) + 1);
        }
      }, 1000);
    },
    [documentId, updateDocument, currentDocument?.currentVersion]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    scheduleSave(newTitle, content);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    scheduleSave(title, newContent);

    // Send typing indicator
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      connectionRef.current.invoke("SendTypingIndicator", documentId, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        connectionRef.current?.invoke("SendTypingIndicator", documentId, false);
      }, 2000);
    }
  };

  const handleCursorMove = () => {
    const editor = editorRef.current;
    if (!editor || connectionRef.current?.state !== signalR.HubConnectionState.Connected) return;
    connectionRef.current.invoke(
      "SendCursorPosition",
      documentId,
      editor.selectionStart,
      editor.selectionEnd
    );
  };

  const handleSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    updateDocument(documentId, { title, content });
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      connectionRef.current.invoke("SendContentUpdate", documentId, content, title);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    await useDocumentStore.getState().deleteDocument(documentId);
    router.push(`/workspaces/${currentDocument?.workspaceId}`);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => router.push(`/workspaces/${currentDocument?.workspaceId}`)}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <input
            ref={titleRef}
            value={title}
            onChange={handleTitleChange}
            className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-foreground outline-none placeholder:text-muted-foreground/50 sm:flex-none"
            placeholder="Untitled document"
          />

          <div className="hidden items-center gap-1.5 sm:flex">
            {isSaving && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Save className="h-3 w-3 animate-pulse" />
                Saving...
              </span>
            )}
            {!isSaving && lastSaved && (
              <span className="text-xs text-muted-foreground">
                Saved
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Connection status */}
          <div className={`h-2 w-2 rounded-full ${
            connectionStatus === "connected" ? "bg-green-500" :
            connectionStatus === "connecting" ? "bg-yellow-500 animate-pulse" :
            "bg-red-500"
          }`} />

          <PresenceAvatars />

          <div className="h-5 w-px bg-white/[0.06]" />

          <button
            onClick={() => { setShowVersions(!showVersions); setShowComments(false); }}
            className={`rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground ${
              showVersions ? "bg-white/[0.06] text-foreground" : ""
            }`}
          >
            <History className="h-4 w-4" />
          </button>

          <button
            onClick={() => { setShowComments(!showComments); setShowVersions(false); }}
            className={`rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground ${
              showComments ? "bg-white/[0.06] text-foreground" : ""
            }`}
          >
            <MessageSquare className="h-4 w-4" />
          </button>

          <button
            onClick={openSidebar}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-[#6366F1]/10 hover:text-[#6366F1]"
            title="AI Assistant"
          >
            <Sparkles className="h-4 w-4" />
          </button>

          <div className="relative hidden sm:block">
            <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="relative flex-1 overflow-auto">
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-12">
            <CursorsOverlay cursors={cursors} editorRef={editorRef} />

            <textarea
              ref={editorRef}
              value={content}
              onChange={handleContentChange}
              onSelect={handleCursorMove}
              onClick={handleCursorMove}
              onKeyUp={handleCursorMove}
              className="min-h-[60vh] w-full resize-none bg-transparent text-base leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/30"
              placeholder="Start writing..."
              spellCheck={false}
            />
          </div>

          {/* Typing indicators */}
          <AnimatePresence>
            {typingUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="fixed bottom-20 left-1/2 -translate-x-1/2 rounded-full border border-white/[0.06] bg-surface px-4 py-2 text-xs text-muted-foreground shadow-xl"
              >
                {typingUsers.map((t) => t.userId).join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Side panels */}
        <AnimatePresence>
          {showVersions && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-l border-white/[0.06]"
            >
              <VersionHistoryPanel
                documentId={documentId}
                onClose={() => setShowVersions(false)}
              />
            </motion.div>
          )}

          {showComments && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-l border-white/[0.06]"
            >
              <CommentsSidebar
                documentId={documentId}
                onClose={() => setShowComments(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status bar */}
      <footer className="flex h-8 items-center justify-between border-t border-white/[0.06] px-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline">{wordCount} words</span>
          <span className="hidden sm:inline">{charCount} characters</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            {onlineUsers.length} online
          </span>
          {currentDocument && (
            <span>Version {currentDocument.currentVersion}</span>
          )}
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 text-red-400 transition-colors hover:text-red-300"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </footer>

      <AIAssistantSidebar documentContent={content} />
    </div>
  );
}
