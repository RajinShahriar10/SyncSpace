"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PartyPopper, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";

export function CompletionScreen() {
  const router = useRouter();
  const { workspace } = useOnboardingStore();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 overflow-hidden"
      >
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-2 w-2 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-5%`,
              background: [
                "#6366F1",
                "#8B5CF6",
                "#06B6D4",
                "#10B981",
                "#F59E0B",
                "#F43F5E",
              ][i % 6],
            }}
            animate={{
              y: ["0vh", "110vh"],
              rotate: [0, 720],
              opacity: [1, 0.5],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              delay: Math.random() * 2,
              repeat: Infinity,
              ease: "easeIn",
            }}
          />
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 150, damping: 20 }}
        className="relative z-10 text-center"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary via-secondary to-accent shadow-2xl shadow-primary/30"
        >
          <PartyPopper className="h-12 w-12 text-white" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-3 text-4xl font-bold md:text-5xl"
        >
          <span className="gradient-text">You&apos;re All Set!</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-2 text-lg text-muted-foreground"
        >
          Welcome to <span className="font-semibold text-foreground">{workspace.name || "Your Project"}</span>
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-10 text-muted-foreground"
        >
          Your group is going to love it here. Let&apos;s dive in!
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            size="xl"
            onClick={() => router.push("/dashboard")}
            className="group gap-2 bg-gradient-to-r from-primary via-secondary to-accent text-white shadow-lg shadow-primary/25 hover:opacity-90"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
