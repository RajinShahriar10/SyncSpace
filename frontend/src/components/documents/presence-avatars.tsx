"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useDocumentStore, type PresenceUser } from "@/features/documents/stores/documentStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function PresenceAvatars() {
  const onlineUsers = useDocumentStore((s) => s.onlineUsers);

  if (onlineUsers.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center -space-x-2">
        <AnimatePresence>
          {onlineUsers.slice(0, 5).map((user, i) => (
            <motion.div
              key={user.connectionId}
              initial={{ scale: 0, x: -10 }}
              animate={{ scale: 1, x: 0 }}
              exit={{ scale: 0, x: -10 }}
              transition={{ delay: i * 0.05 }}
              style={{ zIndex: onlineUsers.length - i }}
            >
              <Tooltip>
                <TooltipTrigger>
                  <div className="relative">
                    <Avatar className="h-7 w-7 border-2 border-background">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback className="bg-primary/20 text-[10px] font-medium text-primary">
                        {user.userName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-surface border-white/[0.06]">
                  <p className="text-xs">{user.userName}</p>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          ))}
        </AnimatePresence>

        {onlineUsers.length > 5 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-white/[0.06] text-[10px] font-medium text-muted-foreground"
          >
            +{onlineUsers.length - 5}
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  );
}
