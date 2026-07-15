"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCourseStore } from "@/features/courses/stores/courseStore";
import { Plus, Search, BookOpen, Users, Trash2, ArrowRight, GraduationCap } from "lucide-react";

const createSchema = z.object({
  courseCode: z.string().min(2, "Course code is required"),
  courseName: z.string().min(2, "Course name is required"),
  semester: z.string().min(2, "Semester is required"),
});
type CreateFormData = z.infer<typeof createSchema>;

const gradients = [
  "from-violet-500/20 to-indigo-500/5",
  "from-primary/20 to-blue-500/5",
  "from-secondary/20 to-purple-500/5",
  "from-emerald-500/20 to-teal-500/5",
  "from-amber-500/20 to-orange-500/5",
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1 } };

export default function CoursesPage() {
  const router = useRouter();
  const { courses, isLoading, fetchCourses, createCourse, deleteCourse } = useCourseStore();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
  });

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const onCreate = async (data: CreateFormData) => {
    setCreating(true);
    try {
      const course = await createCourse(data);
      reset();
      setShowCreate(false);
      router.push(`/courses/${course.id}`);
    } catch {} finally { setCreating(false); }
  };

  const filtered = courses.filter((c) =>
    c.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.courseCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Courses</h1>
            <p className="text-muted-foreground">Manage your academic courses</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> New Course
          </Button>
        </motion.div>

        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <Card className="border-primary/20">
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Create New Course</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Input placeholder="CS301" {...register("courseCode")} className="h-11" />
                        {errors.courseCode && <p className="text-xs text-destructive">{errors.courseCode.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Input placeholder="Software Engineering" {...register("courseName")} className="h-11" />
                        {errors.courseName && <p className="text-xs text-destructive">{errors.courseName.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Input placeholder="Fall 2026" {...register("semester")} className="h-11" />
                        {errors.semester && <p className="text-xs text-destructive">{errors.semester.message}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={creating} className="gap-2">
                        {creating ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Creating...</> : <><Plus className="h-4 w-4" /> Create</>}
                      </Button>
                      <Button variant="ghost" onClick={() => setShowCreate(false)} type="button">Cancel</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {courses.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search courses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11 bg-white/[0.03] border-white/[0.06]" />
          </div>
        )}

        {isLoading && courses.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => <div key={i} className="glass h-52 animate-pulse rounded-2xl" />)}</div>
        ) : filtered.length === 0 && courses.length > 0 ? (
          <div className="py-20 text-center"><Search className="mx-auto mb-4 h-10 w-10 text-muted-foreground/30" /><h3 className="text-lg font-medium">No matching courses</h3></div>
        ) : courses.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
            <div className="relative mx-auto mb-6 h-20 w-20">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 blur-xl" />
              <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-white/[0.06]">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="mb-2 text-lg font-medium">No courses yet</h3>
            <p className="mb-6 text-muted-foreground max-w-sm mx-auto">Create your first course to start organizing project groups.</p>
            <Button onClick={() => setShowCreate(true)} className="gap-2 shadow-lg shadow-primary/20"><Plus className="h-4 w-4" /> Create Course</Button>
          </motion.div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course, idx) => (
              <motion.div key={course.id} variants={item} layout>
                <Card className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-0.5" onClick={() => router.push(`/courses/${course.id}`)}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradients[idx % gradients.length]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <CardContent className="relative p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 text-lg font-bold text-primary group-hover:scale-110 transition-transform duration-300">
                        {course.courseCode[0]}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${course.courseName}"?`)) deleteCourse(course.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground mb-1">{course.courseCode}</p>
                    <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">{course.courseName}</h3>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{course.semester}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {course.groupCount} groups</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
