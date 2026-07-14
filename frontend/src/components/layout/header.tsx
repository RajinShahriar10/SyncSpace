"use client";

import dynamic from "next/dynamic";
import { Search, Moon, Sun, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useAuthStore, useUIStore } from "@/store";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationDropdown from "@/features/notifications/components/NotificationDropdown";
import { useSearchStore } from "@/features/search/stores/searchStore";

const CommandPalette = dynamic(() => import("@/features/search/components/CommandPalette"), { ssr: false });

export function Header() {
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const setOpen = useSearchStore((s) => s.setOpen);
  const { toggleMobileMenu } = useUIStore();

  return (
    <>
      <header className="glass sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b border-white/10 px-3 sm:px-6">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden shrink-0"
            onClick={toggleMobileMenu}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <button
            onClick={() => setOpen(true)}
            className="relative max-w-md flex-1 group"
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-hover:text-foreground/60 transition-colors" />
            <div className="h-9 sm:h-10 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-9 sm:pl-10 pr-12 sm:pr-16 text-xs sm:text-sm text-muted-foreground text-left leading-9 sm:leading-10 cursor-pointer hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-200">
              <span className="hidden sm:inline">Search everything...</span>
              <span className="sm:hidden">Search...</span>
            </div>
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hidden sm:block">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 sm:h-5 sm:w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 sm:h-5 sm:w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          <NotificationDropdown />

          <div className="ml-1 sm:ml-2">
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 ring-2 ring-white/5 hover:ring-primary/20 transition-all cursor-pointer">
              <AvatarImage src={user?.avatarUrl} alt={user?.firstName} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary text-[10px] sm:text-xs font-bold">
                {user ? getInitials(`${user.firstName} ${user.lastName}`) : "SS"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <CommandPalette />
    </>
  );
}
