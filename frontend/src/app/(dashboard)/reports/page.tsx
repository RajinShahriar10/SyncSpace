"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
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
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

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

const reportTypes = [
  {
    title: "Student Report",
    description:
      "Individual contribution analysis, activity trends, and performance metrics",
    icon: Users,
    color: "primary",
    href: "/reports/student/",
    gradient: "from-indigo-500/10 to-violet-500/10",
  },
  {
    title: "Group Report",
    description:
      "Team progress, milestone completion, and contribution distribution",
    icon: Users,
    color: "secondary",
    href: "/reports/group/",
    gradient: "from-purple-500/10 to-pink-500/10",
  },
  {
    title: "Instructor Report",
    description:
      "Course statistics, group rankings, and participation analytics",
    icon: BookOpen,
    color: "emerald",
    href: "/reports/instructor/",
    gradient: "from-emerald-500/10 to-teal-500/10",
  },
  {
    title: "Semester Summary",
    description:
      "Comprehensive semester evaluation with top performers and trends",
    icon: Calendar,
    color: "amber",
    href: "/reports/semester/",
    gradient: "from-amber-500/10 to-orange-500/10",
  },
]

export default function ReportsPage() {
  const [searchId, setSearchId] = useState("")
  const [idError, setIdError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleNavigate = (href: string) => {
    if (searchId.trim()) {
      setIdError("")
      router.push(`${href}${searchId}`)
    } else {
      setIdError("Enter an ID above first")
      inputRef.current?.focus()
    }
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border border-border-subtle bg-surface-sunken backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <GraduationCap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={inputRef}
                    placeholder="Enter Course ID or Student ID..."
                    value={searchId}
                    onChange={(e) => { setSearchId(e.target.value); setIdError("") }}
                    className="pl-10 bg-surface-sunken border-border-subtle text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20"
                  />
                  {idError && (
                    <p className="text-xs text-amber-400 mt-1.5">{idError}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="border-border-subtle bg-surface-sunken hover:bg-surface-hover text-foreground"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export All
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {reportTypes.map((report) => {
            const Icon = report.icon
            return (
              <motion.div key={report.title} variants={item}>
                <Card
                  className="group relative overflow-hidden border border-border-subtle bg-surface-sunken backdrop-blur-xl cursor-pointer transition-all duration-300 hover:border-border-default hover:bg-surface-hover"
                  onClick={() => handleNavigate(report.href)}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${report.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />
                  <CardContent className="relative p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-border-subtle group-hover:scale-110 transition-transform duration-300">
                        <Icon
                          className={`h-6 w-6 ${
                            report.color === "primary"
                              ? "text-indigo-400"
                              : report.color === "secondary"
                              ? "text-purple-400"
                              : report.color === "emerald"
                              ? "text-emerald-400"
                              : "text-amber-400"
                          }`}
                        />
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-hover border border-border-subtle opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-lg font-medium text-foreground mb-1 group-hover:text-indigo-300 transition-colors duration-300">
                        {report.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {report.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

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