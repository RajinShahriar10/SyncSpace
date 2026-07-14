"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";

const floatingOrbs = [
  { size: 300, x: "10%", y: "20%", color: "rgba(99,102,241,0.15)", delay: 0 },
  { size: 200, x: "75%", y: "15%", color: "rgba(139,92,246,0.12)", delay: 0.5 },
  { size: 250, x: "60%", y: "70%", color: "rgba(6,182,212,0.1)", delay: 1 },
  { size: 180, x: "20%", y: "75%", color: "rgba(99,102,241,0.08)", delay: 1.5 },
];

const features = [
  { icon: "Documents", label: "Real-time documents", desc: "Collaborate instantly" },
  { icon: "Boards", label: "Kanban boards", desc: "Track every task" },
  { icon: "Messages", label: "Team messaging", desc: "Stay connected" },
  { icon: "Workspaces", label: "Shared spaces", desc: "Organize everything" },
];

export function WelcomeStep() {
  const { nextStep } = useOnboardingStore();

  return (
    <div className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4">
      {floatingOrbs.map((orb, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute rounded-full blur-3xl"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: orb.color,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            delay: orb.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mb-8"
      >
        <motion.div
          className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent shadow-2xl shadow-primary/30"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="h-10 w-10 text-white" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center"
      >
        <h1 className="mb-4 text-5xl font-bold tracking-tight md:text-6xl">
          <span className="gradient-text">Welcome to SyncSpace</span>
        </h1>
        <p className="mx-auto mb-12 max-w-lg text-lg text-muted-foreground">
          Your all-in-one platform for documents, boards, messaging, and real-time
          collaboration. Let&apos;s get you set up in just a few steps.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="relative z-10 mb-12 grid w-full max-w-2xl grid-cols-2 gap-3 md:grid-cols-4"
      >
        {features.map((feature, i) => (
          <motion.div
            key={feature.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="glass rounded-xl p-4 text-center"
          >
            <div className="mb-2 text-2xl">
              {feature.icon === "Documents" && "📄"}
              {feature.icon === "Boards" && "📋"}
              {feature.icon === "Messages" && "💬"}
              {feature.icon === "Workspaces" && "🏠"}
            </div>
            <p className="text-sm font-medium">{feature.label}</p>
            <p className="text-xs text-muted-foreground">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="relative z-10"
      >
        <Button size="xl" onClick={nextStep} className="group gap-2">
          Get Started
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 z-10"
      >
        <p className="text-xs text-muted-foreground">
          Takes about 2 minutes to set up
        </p>
      </motion.div>
    </div>
  );
}
