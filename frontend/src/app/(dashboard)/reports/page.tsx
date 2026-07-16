"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText,
  Users,
  BookOpen,
  BarChart3,
  Download,
  ArrowRight,
  GraduationCap,
  Calendar,
  Shield,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  User,
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/store"
import { getCourses, type Course } from "@/lib/course"
import { getGroupsByCourse, type ProjectGroup } from "@/lib/projectGroup"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

const fadeIn = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

export default function ReportsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [courseGroups, setCourseGroups] = useState<Record<string, ProjectGroup[]>>({})
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCoursesAndGroups = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const courseList = await getCourses()
      setCourses(courseList)

      const groupsMap: Record<string, ProjectGroup[]> = {}
      await Promise.all(
        courseList.map(async (course) => {
          try {
            const groups = await getGroupsByCourse(course.id)
            groupsMap[course.id] = groups
          } catch {
            groupsMap[course.id] = []
          }
        })
      )
      setCourseGroups(groupsMap)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courses")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCoursesAndGroups()
  }, [fetchCoursesAndGroups])

  const toggleCourse = (courseId: string) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId)
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-border-subtle">
              <FileText className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Academic Reports
              </h1>
              <p className="text-sm text-muted-foreground">
                Generate and export evaluation reports
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border border-border-subtle bg-surface-sunken backdrop-blur-xl">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-foreground mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="border-border-subtle bg-surface-sunken hover:bg-surface-hover text-foreground"
                  onClick={() => user && router.push(`/reports/student/${user.id}`)}
                  disabled={!user}
                >
                  <User className="mr-2 h-4 w-4" />
                  My Student Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Courses & Groups */}
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-20"
          >
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="border border-red-500/20 bg-red-500/5">
              <CardContent className="p-6 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div>
                  <p className="text-sm text-foreground">{error}</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-xs text-muted-foreground"
                    onClick={fetchCoursesAndGroups}
                  >
                    Try again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : courses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="border border-border-subtle bg-surface-sunken">
              <CardContent className="p-10 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No courses found. Create a course first to generate reports.</p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {courses.map((course) => {
              const groups = courseGroups[course.id] || []
              const isExpanded = expandedCourse === course.id

              return (
                <motion.div key={course.id} variants={item}>
                  <Card className="border border-border-subtle bg-surface-sunken backdrop-blur-xl overflow-hidden">
                    {/* Course Header */}
                    <div
                      className="flex items-center justify-between p-5 cursor-pointer hover:bg-surface-hover transition-colors"
                      onClick={() => toggleCourse(course.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-border-subtle">
                          <BookOpen className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-base font-medium text-foreground">
                            {course.courseName}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {course.courseCode} &middot; {course.semester} &middot; {groups.length} group{groups.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Report buttons */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border-subtle bg-surface-sunken hover:bg-surface-hover text-foreground"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/reports/instructor/${course.id}`)
                          }}
                        >
                          <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
                          Instructor
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border-subtle bg-surface-sunken hover:bg-surface-hover text-foreground"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/reports/semester/${course.id}`)
                          }}
                        >
                          <Calendar className="mr-1.5 h-3.5 w-3.5" />
                          Semester
                        </Button>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Groups List */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <div className="border-t border-border-subtle">
                            {groups.length === 0 ? (
                              <div className="p-5 text-center">
                                <p className="text-xs text-muted-foreground">No groups in this course yet.</p>
                              </div>
                            ) : (
                              <div className="divide-y divide-border-subtle">
                                {groups.map((group) => (
                                  <div
                                    key={group.id}
                                    className="flex items-center justify-between px-5 py-3 hover:bg-surface-hover transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20">
                                        <Users className="h-4 w-4 text-purple-400" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-foreground">{group.groupName}</p>
                                        <p className="text-xs text-muted-foreground">
                                          Leader: {group.leaderName} &middot; {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-border-subtle bg-surface-sunken hover:bg-surface-hover text-foreground"
                                      onClick={() => router.push(`/reports/group/${group.id}`)}
                                    >
                                      <FileText className="mr-1.5 h-3.5 w-3.5" />
                                      Group Report
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* Privacy Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8"
        >
          <Card className="border border-border-subtle bg-surface-sunken backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Shield className="h-4 w-4 text-emerald-400" />
                </div>
                <h3 className="text-sm font-medium text-foreground">
                  Data Privacy Notice
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All reports are generated in compliance with FERPA regulations.
                Student data is encrypted at rest and in transit. Access to
                individual reports is logged for audit purposes. Reports are
                automatically archived after 90 days.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
