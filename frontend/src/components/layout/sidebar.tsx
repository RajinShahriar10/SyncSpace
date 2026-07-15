"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, FileText, KanbanSquare, MessageSquare,
  Settings, Bell, Users, ChevronLeft, Plus, Activity, BarChart3, Shield,
  BookOpen, Target, GraduationCap, Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store";

const sections = [
  {
    label: "Academic",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Courses", href: "/courses", icon: BookOpen },
    ],
  },
  {
    label: "Workspace",
    items: [
      { name: "Projects", href: "/workspaces", icon: GraduationCap },
      { name: "Documents", href: "/documents", icon: FileText },
      { name: "Boards", href: "/boards", icon: KanbanSquare },
      { name: "Messages", href: "/messages", icon: MessageSquare },
    ],
  },
  {
    label: "Insights",
    items: [
      { name: "Activity", href: "/activity", icon: Activity },
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
      { name: "Leaderboard", href: "/contributions/leaderboard", icon: Trophy },
    ],
  },
  {
    label: "Account",
    items: [
      { name: "Notifications", href: "/notifications", icon: Bell },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 260 : 72 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="glass sticky top-0 flex h-screen w-[260px] md:w-auto flex-col border-r border-white/10"
    >
      <div className="flex h-16 items-center justify-between px-4">
        {sidebarOpen && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="gradient-text text-xl font-bold">
            SyncSpace <span className="text-xs font-normal text-muted-foreground">EDU</span>
          </motion.span>
        )}
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="ml-auto shrink-0 hidden md:flex">
          <motion.div animate={{ rotate: sidebarOpen ? 0 : 180 }} transition={{ duration: 0.3 }}>
            <ChevronLeft className="h-5 w-5" />
          </motion.div>
        </Button>
      </div>

      <div className="flex-1 space-y-4 px-3 py-2 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label}>
            {sidebarOpen && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">{section.label}</p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link key={item.name} href={item.href} onClick={onNavigate}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      )}
                    >
                      {isActive && <motion.div layoutId="sidebar-active" className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" transition={{ type: "spring", stiffness: 350, damping: 30 }} />}
                      <item.icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                      {sidebarOpen && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="truncate">{item.name}</motion.span>}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 p-3">
        <Button variant="glass" className="w-full justify-start gap-3" asChild>
          <Link href="/courses" onClick={onNavigate}>
            <Plus className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>New Course</span>}
          </Link>
        </Button>
      </div>
    </motion.aside>
  );
}
