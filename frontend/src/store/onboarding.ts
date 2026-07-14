"use client";

import { create } from "zustand";

export type OnboardingStep = "welcome" | "workspace" | "invite" | "theme" | "document";

export interface WorkspaceData {
  name: string;
  slug: string;
  description: string;
}

export interface InviteData {
  emails: string[];
}

export interface ThemeData {
  accent: string;
  style: "minimal" | "modern" | "bold";
}

export interface DocumentData {
  title: string;
  content: string;
}

interface OnboardingState {
  currentStep: OnboardingStep;
  isCompleted: boolean;
  workspace: WorkspaceData;
  invite: InviteData;
  theme: ThemeData;
  document: DocumentData;
  setStep: (step: OnboardingStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  setWorkspace: (data: Partial<WorkspaceData>) => void;
  setInvite: (data: Partial<InviteData>) => void;
  addInviteEmail: (email: string) => void;
  removeInviteEmail: (email: string) => void;
  setTheme: (data: Partial<ThemeData>) => void;
  setDocument: (data: Partial<DocumentData>) => void;
  completeOnboarding: () => void;
  reset: () => void;
}

const STEPS: OnboardingStep[] = ["welcome", "workspace", "invite", "theme", "document"];

const initialState = {
  currentStep: "welcome" as OnboardingStep,
  isCompleted: false,
  workspace: { name: "", slug: "", description: "" },
  invite: { emails: [] as string[] },
  theme: { accent: "#6366F1", style: "modern" as const },
  document: { title: "", content: "" },
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),

  nextStep: () =>
    set((state) => {
      const idx = STEPS.indexOf(state.currentStep);
      if (idx < STEPS.length - 1) return { currentStep: STEPS[idx + 1] };
      return {};
    }),

  prevStep: () =>
    set((state) => {
      const idx = STEPS.indexOf(state.currentStep);
      if (idx > 0) return { currentStep: STEPS[idx - 1] };
      return {};
    }),

  setWorkspace: (data) =>
    set((state) => ({ workspace: { ...state.workspace, ...data } })),

  setInvite: (data) =>
    set((state) => ({ invite: { ...state.invite, ...data } })),

  addInviteEmail: (email) =>
    set((state) => ({
      invite: { ...state.invite, emails: [...state.invite.emails, email] },
    })),

  removeInviteEmail: (email) =>
    set((state) => ({
      invite: {
        ...state.invite,
        emails: state.invite.emails.filter((e) => e !== email),
      },
    })),

  setTheme: (data) =>
    set((state) => ({ theme: { ...state.theme, ...data } })),

  setDocument: (data) =>
    set((state) => ({ document: { ...state.document, ...data } })),

  completeOnboarding: () => set({ isCompleted: true }),

  reset: () => set(initialState),
}));

export { STEPS };
