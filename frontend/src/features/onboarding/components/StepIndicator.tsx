"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useOnboardingStore, STEPS, type OnboardingStep } from "@/store/onboarding";

const stepMeta: Record<OnboardingStep, { label: string; number: number }> = {
  welcome: { label: "Welcome", number: 1 },
  workspace: { label: "Workspace", number: 2 },
  invite: { label: "Invite", number: 3 },
  theme: { label: "Theme", number: 4 },
  document: { label: "Document", number: 5 },
};

export function StepIndicator() {
  const { currentStep, setStep } = useOnboardingStore();
  const currentIdx = STEPS.indexOf(currentStep);

  return (
    <div className="fixed left-0 right-0 top-0 z-50">
      <div className="glass-strong mx-auto mt-4 flex max-w-2xl items-center justify-between rounded-2xl px-6 py-3">
        {STEPS.map((step, idx) => {
          const meta = stepMeta[step];
          const isCompleted = idx < currentIdx;
          const isActive = idx === currentIdx;
          const isClickable = idx < currentIdx;

          return (
            <div key={step} className="flex items-center">
              <button
                onClick={() => isClickable && setStep(step)}
                disabled={!isClickable}
                className={`flex items-center gap-2 rounded-lg px-2 py-1 transition-all ${
                  isClickable
                    ? "cursor-pointer hover:bg-white/5"
                    : "cursor-default"
                }`}
              >
                <motion.div
                  layout
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isCompleted
                      ? "bg-emerald-500/20 text-emerald-400"
                      : isActive
                        ? "bg-primary/20 text-primary shadow-lg shadow-primary/20"
                        : "bg-white/5 text-muted-foreground"
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </motion.div>
                    ) : (
                      <motion.span
                        key="num"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {meta.number}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
                <span
                  className={`hidden text-sm font-medium md:block ${
                    isActive
                      ? "text-foreground"
                      : isCompleted
                        ? "text-emerald-400"
                        : "text-muted-foreground"
                  }`}
                >
                  {meta.label}
                </span>
              </button>

              {idx < STEPS.length - 1 && (
                <div className="mx-1 hidden h-px w-6 md:block">
                  <motion.div
                    className="h-full bg-white/10"
                    initial={false}
                    animate={{
                      backgroundColor:
                        idx < currentIdx
                          ? "rgba(52, 211, 153, 0.4)"
                          : "rgba(255, 255, 255, 0.1)",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
