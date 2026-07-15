"use client";

import { create } from "zustand";
import type {
  StudentReport,
  GroupReport,
  InstructorReport,
  SemesterSummary,
} from "@/lib/reports";
import * as reportsApi from "@/lib/reports";

interface ReportState {
  studentReport: StudentReport | null;
  groupReport: GroupReport | null;
  instructorReport: InstructorReport | null;
  semesterSummary: SemesterSummary | null;
  isLoading: boolean;
  error: string | null;

  fetchStudentReport: (userId: string, courseId?: string) => Promise<void>;
  fetchGroupReport: (groupId: string) => Promise<void>;
  fetchInstructorReport: (courseId: string) => Promise<void>;
  fetchSemesterSummary: (courseId: string) => Promise<void>;
  clearReports: () => void;
}

export const useReportStore = create<ReportState>((set) => ({
  studentReport: null,
  groupReport: null,
  instructorReport: null,
  semesterSummary: null,
  isLoading: false,
  error: null,

  fetchStudentReport: async (userId, courseId) => {
    set({ isLoading: true, error: null });
    try {
      const studentReport = await reportsApi.getStudentReport(userId, courseId);
      set({ studentReport, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch student report";
      set({ error: message, isLoading: false });
    }
  },

  fetchGroupReport: async (groupId) => {
    set({ isLoading: true, error: null });
    try {
      const groupReport = await reportsApi.getGroupReport(groupId);
      set({ groupReport, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch group report";
      set({ error: message, isLoading: false });
    }
  },

  fetchInstructorReport: async (courseId) => {
    set({ isLoading: true, error: null });
    try {
      const instructorReport = await reportsApi.getInstructorReport(courseId);
      set({ instructorReport, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch instructor report";
      set({ error: message, isLoading: false });
    }
  },

  fetchSemesterSummary: async (courseId) => {
    set({ isLoading: true, error: null });
    try {
      const semesterSummary = await reportsApi.getSemesterSummary(courseId);
      set({ semesterSummary, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch semester summary";
      set({ error: message, isLoading: false });
    }
  },

  clearReports: () => {
    set({
      studentReport: null,
      groupReport: null,
      instructorReport: null,
      semesterSummary: null,
      error: null,
    });
  },
}));
