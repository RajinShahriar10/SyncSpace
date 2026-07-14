"use client";

import { motion, AnimatePresence } from "framer-motion";

interface CursorData {
  userId: string;
  position: number;
  selectionEnd: number;
  userName: string;
  color: string;
}

interface CursorsOverlayProps {
  cursors: Record<string, CursorData>;
  editorRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function CursorsOverlay({ cursors, editorRef }: CursorsOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence>
        {Object.values(cursors).map((cursor) => {
          // Simple cursor position estimation based on character count
          // In production, you'd use a proper text measurement library
          const text = editorRef.current?.value || "";
          const lineHeight = 28; // approximate
          const charWidth = 8.4; // approximate for monospace
          const charsPerLine = Math.floor(640 / charWidth); // editor width ~640px

          const line = Math.floor(cursor.position / charsPerLine);
          const col = cursor.position % charsPerLine;

          return (
            <motion.div
              key={cursor.userId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute"
              style={{
                left: `${col * charWidth + 32}px`,
                top: `${line * lineHeight + 48}px`,
                transition: "left 0.1s, top 0.1s",
              }}
            >
              {/* Cursor line */}
              <div
                className="w-0.5 rounded-full"
                style={{
                  height: `${lineHeight}px`,
                  backgroundColor: cursor.color,
                }}
              />

              {/* User name label */}
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-6 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                style={{ backgroundColor: cursor.color }}
              >
                {cursor.userName}
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
