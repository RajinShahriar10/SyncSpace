"use client";

import { create } from "zustand";
import * as courseApi from "@/lib/course";

interface CourseState {
  courses: courseApi.Course[];
  currentCourse: courseApi.CourseDetail | null;
  isLoading: boolean;
  error: string | null;
  fetchCourses: () => Promise<void>;
  fetchCourse: (id: string) => Promise<void>;
  createCourse: (data: { courseCode: string; courseName: string; semester: string }) => Promise<courseApi.Course>;
  updateCourse: (id: string, data: { courseCode?: string; courseName?: string; semester?: string }) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
}

export const useCourseStore = create<CourseState>((set) => ({
  courses: [],
  currentCourse: null,
  isLoading: false,
  error: null,

  fetchCourses: async () => {
    set({ isLoading: true, error: null });
    try {
      const courses = await courseApi.getCourses();
      set({ courses, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch courses";
      set({ error: message, isLoading: false });
    }
  },

  fetchCourse: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const course = await courseApi.getCourse(id);
      set({ currentCourse: course, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch course";
      set({ error: message, isLoading: false });
    }
  },

  createCourse: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const course = await courseApi.createCourse(data);
      set((state) => ({ courses: [course, ...state.courses], isLoading: false }));
      return course;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create course";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateCourse: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await courseApi.updateCourse(id, data);
      set((state) => ({
        courses: state.courses.map((c) => (c.id === id ? updated : c)),
        currentCourse: state.currentCourse?.id === id ? { ...state.currentCourse, ...updated } : state.currentCourse,
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update course";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteCourse: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await courseApi.deleteCourse(id);
      set((state) => ({
        courses: state.courses.filter((c) => c.id !== id),
        currentCourse: state.currentCourse?.id === id ? null : state.currentCourse,
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete course";
      set({ error: message, isLoading: false });
      throw error;
    }
  },
}));
