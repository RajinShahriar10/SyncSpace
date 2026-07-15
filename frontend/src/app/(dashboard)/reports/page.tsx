"use client"

import { useState } from "react"
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
  const router = useRouter()

  const handleNavigate = (href: string) => {
    if (searchId.trim()) {
      router.push(`${href}${searchId}`)
    }
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#0a0a0f] p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-white/[0.06]">
              <FileText className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">
                Academic Reports
              </h1>
              <p className="text-sm text-zinc-400">
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
          <Card className="border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <GraduationCap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    placeholder="Enter Course ID or Student ID..."
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    className="pl-10 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-zinc-500 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                  />
                </div>
                <Button
                  variant="outline"
                  className="border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] text-zinc-300"
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
                  className="group relative overflow-hidden border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl cursor-pointer transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]"
                  onClick={() => handleNavigate(report.href)}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${report.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />
                  <CardContent className="relative p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.06] group-hover:scale-110 transition-transform duration-300">
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
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.06] opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
                        <ArrowRight className="h-4 w-4 text-zinc-400" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-lg font-medium text-white mb-1 group-hover:text-indigo-300 transition-colors duration-300">
                        {report.title}
                      </h3>
                      <p className="text-sm text-zinc-400 leading-relaxed">
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
          <Card className="border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Shield className="h-4 w-4 text-emerald-400" />
                </div>
                <h3 className="text-sm font-medium text-white">
                  Data Privacy Notice
                </h3>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
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