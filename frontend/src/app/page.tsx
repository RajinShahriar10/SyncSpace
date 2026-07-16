"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  BookOpen, GraduationCap, FileText, Users, Target, Shield,
  BarChart3, MessageSquare, KanbanSquare, Milestone, AlertTriangle,
  Trophy, CheckCircle2, ArrowRight, Sparkles,
} from "lucide-react";

const floatingItems = [
  { icon: BookOpen, label: "Courses", x: "8%", y: "15%", delay: 0, duration: 6, size: "h-10 w-10" },
  { icon: GraduationCap, label: "Projects", x: "85%", y: "12%", delay: 0.5, duration: 7, size: "h-11 w-11" },
  { icon: FileText, label: "Documents", x: "15%", y: "75%", delay: 1, duration: 5.5, size: "h-9 w-9" },
  { icon: Users, label: "Collaborate", x: "78%", y: "70%", delay: 1.5, duration: 6.5, size: "h-10 w-10" },
  { icon: Target, label: "Milestones", x: "5%", y: "45%", delay: 0.8, duration: 7.5, size: "h-8 w-8" },
  { icon: Shield, label: "Instructor", x: "90%", y: "42%", delay: 2, duration: 5, size: "h-9 w-9" },
  { icon: BarChart3, label: "Analytics", x: "22%", y: "88%", delay: 0.3, duration: 6, size: "h-8 w-8" },
  { icon: MessageSquare, label: "Chat", x: "72%", y: "85%", delay: 1.2, duration: 7, size: "h-9 w-9" },
  { icon: KanbanSquare, label: "Boards", x: "12%", y: "30%", delay: 1.8, duration: 5.5, size: "h-8 w-8" },
  { icon: Milestone, label: "Tracking", x: "88%", y: "28%", delay: 0.7, duration: 6.5, size: "h-9 w-9" },
  { icon: AlertTriangle, label: "Risk Detection", x: "3%", y: "60%", delay: 2.2, duration: 7.5, size: "h-8 w-8" },
  { icon: Trophy, label: "Leaderboard", x: "92%", y: "58%", delay: 0.4, duration: 5, size: "h-9 w-9" },
];

const features = [
  {
    icon: BookOpen,
    title: "Course Management",
    description: "Organize courses, assign groups, and track academic progress in one place.",
    color: "from-indigo-500/15 to-violet-500/15",
    iconColor: "text-indigo-400",
  },
  {
    icon: Users,
    title: "Group Collaboration",
    description: "Real-time collaboration with shared documents, boards, and messaging.",
    color: "from-purple-500/15 to-pink-500/15",
    iconColor: "text-purple-400",
  },
  {
    icon: Target,
    title: "Milestone Tracking",
    description: "Set deadlines, track progress, and never miss an important deliverable.",
    color: "from-emerald-500/15 to-teal-500/15",
    iconColor: "text-emerald-400",
  },
  {
    icon: BarChart3,
    title: "Contribution Analytics",
    description: "Understand team dynamics with scoring, heatmaps, and activity trends.",
    color: "from-amber-500/15 to-orange-500/15",
    iconColor: "text-amber-400",
  },
  {
    icon: AlertTriangle,
    title: "Early Risk Detection",
    description: "AI-powered alerts identify at-risk groups before problems escalate.",
    color: "from-rose-500/15 to-red-500/15",
    iconColor: "text-rose-400",
  },
  {
    icon: Shield,
    title: "Instructor Dashboard",
    description: "Monitor all groups, health scores, and participation from a unified view.",
    color: "from-cyan-500/15 to-blue-500/15",
    iconColor: "text-cyan-400",
  },
];

const stats = [
  { value: "Real-Time", label: "Live collaboration" },
  { value: "Unified", label: "All tools in one place" },
  { value: "Smart", label: "AI-powered insights" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,rgba(139,92,246,0.08),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_30%_at_20%_60%,rgba(6,182,212,0.06),transparent)]" />

      {/* Floating items */}
      {floatingItems.map((floating, i) => (
        <motion.div
          key={i}
          className="absolute hidden lg:flex items-center justify-center"
          style={{ left: floating.x, top: floating.y }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: floating.delay, duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            animate={{
              y: [0, -12, 0],
              rotate: [0, i % 2 === 0 ? 5 : -5, 0],
            }}
            transition={{
              duration: floating.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="glass rounded-2xl p-3 flex items-center justify-center"
          >
            <floating.icon className={`${floating.size} text-primary/40`} />
          </motion.div>
        </motion.div>
      ))}

      {/* Grid dots pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center pt-20 sm:pt-28 pb-20 px-4 sm:px-6 w-full max-w-6xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="glass-strong rounded-full px-5 py-2 text-sm font-medium text-muted-foreground flex items-center gap-2 mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            Academic Collaboration Platform
          </div>
        </motion.div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-center mb-6"
        >
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight">
            <span className="gradient-text">SyncSpace</span>
            <span className="text-primary ml-3">EDU</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="max-w-xl text-center text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10"
        >
          The intelligent workspace for university teams. Track contributions,
          manage milestones, detect risks early — all in one premium platform.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 mb-20"
        >
          <Link href="/login">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 px-8 gap-2"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="lg"
              variant="outline"
              className="border-border-subtle hover:bg-surface-hover px-8"
            >
              Create Account
            </Button>
          </Link>
        </motion.div>

        {/* Stats row */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-24"
        >
          {stats.map((stat) => (
            <motion.div key={stat.value} variants={item}>
              <div className="glass rounded-2xl px-8 py-5 text-center min-w-[160px]">
                <div className="text-2xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="w-full"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Built for <span className="gradient-text">Academic Excellence</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Everything your team needs to collaborate, track progress, and succeed together.
            </p>
          </div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={item}>
                <div className="glass rounded-2xl p-6 h-full hover:bg-surface-hover transition-all duration-300 group">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-24 text-center"
        >
          <div className="glass rounded-3xl p-10 sm:p-14 max-w-2xl mx-auto relative overflow-hidden">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-secondary/10 blur-3xl" />
            <div className="relative z-10">
              <CheckCircle2 className="h-10 w-10 text-accent mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                Ready to transform your workflow?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Join teams already using SyncSpace EDU to collaborate smarter and achieve more.
              </p>
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 px-10 gap-2"
                >
                  Start for Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-20 pb-8 text-center text-xs text-muted-foreground">
          SyncSpace EDU — University Project Collaboration & Supervision Platform
        </div>
      </main>
    </div>
  );
}
