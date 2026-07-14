"use client";

import { AnimatePresence, motion } from "framer-motion";
import { StepIndicator } from "@/features/onboarding/components/StepIndicator";
import { CompletionScreen } from "@/features/onboarding/components/CompletionScreen";
import { WelcomeStep } from "@/features/onboarding/components/steps/WelcomeStep";
import { CreateWorkspaceStep } from "@/features/onboarding/components/steps/CreateWorkspaceStep";
import { InviteTeamStep } from "@/features/onboarding/components/steps/InviteTeamStep";
import { ThemeStep } from "@/features/onboarding/components/steps/ThemeStep";
import { FirstDocumentStep } from "@/features/onboarding/components/steps/FirstDocumentStep";
import { useOnboardingStore } from "@/store/onboarding";

const pageVariants = {
  initial: { opacity: 0, x: 60, scale: 0.98 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    x: -60,
    scale: 0.98,
    transition: { duration: 0.3, ease: [0.4, 0, 1, 1] },
  },
};

function StepContent() {
  const { currentStep } = useOnboardingStore();

  const stepMap = {
    welcome: <WelcomeStep />,
    workspace: <CreateWorkspaceStep />,
    invite: <InviteTeamStep />,
    theme: <ThemeStep />,
    document: <FirstDocumentStep />,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {stepMap[currentStep]}
      </motion.div>
    </AnimatePresence>
  );
}

export default function OnboardingPage() {
  const { isCompleted } = useOnboardingStore();

  if (isCompleted) {
    return <CompletionScreen />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]" />

      <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-[400px] w-[400px] -translate-x-1/2 translate-y-1/2 rounded-full bg-secondary/5 blur-3xl" />
      <div className="absolute right-0 top-0 h-[400px] w-[400px] translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-3xl" />

      <StepIndicator />

      <div className="relative z-10 px-4 pt-20 sm:px-6">
        <StepContent />
      </div>
    </div>
  );
}
