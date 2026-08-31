import * as XLSX from "xlsx";
import type { StudentReport } from "@/lib/reports";

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, `${filename}.csv`, { bookType: "csv" });
}

export function exportToExcel(data: Record<string, unknown>[], filename: string, sheetName = "Report") {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportStudentReportToExcel(report: StudentReportExport) {
  const summaryData = [
    { Field: "Student Name", Value: report.fullName },
    { Field: "Email", Value: report.email || "" },
    { Field: "Generated At", Value: new Date(report.generatedAt).toLocaleDateString() },
    { Field: "", Value: "" },
    { Field: "Total Contribution Score", Value: report.summary.totalContributionScore },
    { Field: "Last 30 Days Score", Value: report.summary.last30DaysScore },
    { Field: "Tasks Completed", Value: report.summary.tasksCompleted },
    { Field: "Tasks Created", Value: report.summary.tasksCreated },
    { Field: "Documents Edited", Value: report.summary.documentsEdited },
    { Field: "Files Uploaded", Value: report.summary.filesUploaded },
    { Field: "Comments Added", Value: report.summary.commentsAdded },
    { Field: "Messages Sent", Value: report.summary.messagesSent },
    { Field: "Total Activities", Value: report.summary.totalActivities },
    { Field: "Milestones Completed", Value: report.summary.milestonesCompleted },
    { Field: "Groups Count", Value: report.summary.groupsCount },
  ];

  const activityData = report.activityTrend.map((a) => ({
    Week: a.label,
    Score: a.score,
    TasksCompleted: a.tasksCompleted,
  }));

  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  const wsActivity = XLSX.utils.json_to_sheet(activityData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
  XLSX.utils.book_append_sheet(wb, wsActivity, "Activity Trend");
  XLSX.writeFile(wb, `${report.fullName.replace(/\s+/g, "_")}_Report.xlsx`);
}

export function exportGroupReportToExcel(report: GroupReportExport) {
  const memberData = report.members.map((m) => ({
    Name: m.fullName,
    Role: m.isLeader ? "Leader" : "Member",
    Score: m.totalScore,
    TasksCompleted: m.tasksCompleted,
    DocumentsEdited: m.documentsEdited,
    FilesUploaded: m.filesUploaded,
    ContributionPercent: m.contributionPercent + "%",
  }));

  const wb = XLSX.utils.book_new();
  const wsMembers = XLSX.utils.json_to_sheet(memberData);
  XLSX.utils.book_append_sheet(wb, wsMembers, "Members");
  XLSX.writeFile(wb, `${report.groupName.replace(/\s+/g, "_")}_Report.xlsx`);
}

export function exportToPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) return;
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${filename}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; color: #1a1a1a; background: #fff; padding: 40px; }
        h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
        h2 { font-size: 18px; font-weight: 600; margin: 24px 0 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
        h3 { font-size: 14px; font-weight: 600; margin: 16px 0 8px; }
        p { font-size: 13px; line-height: 1.6; color: #4b5563; }
        .header { text-align: center; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 3px solid #6366f1; }
        .header .subtitle { color: #6366f1; font-size: 14px; font-weight: 500; }
        .header .date { color: #9ca3af; font-size: 12px; margin-top: 4px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0; }
        .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: center; }
        .stat-card .value { font-size: 24px; font-weight: 700; color: #6366f1; }
        .stat-card .label { font-size: 11px; color: #6b7280; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
        th { background: #f3f4f6; text-align: left; padding: 8px 12px; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
        td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
        tr:nth-child(even) { background: #fafafa; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 500; }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-yellow { background: #fef9c3; color: #854d0e; }
        .badge-red { background: #fee2e2; color: #991b1b; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #9ca3af; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>${element.innerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => { printWindow.print(); }, 500);
}

export function exportStudentReportToPDF(report: StudentReport) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const summaryRows: [string, string, string][] = [
    ["Total Contribution Score", report.summary.totalContributionScore.toLocaleString(), "Performance"],
    ["Last 30 Days Score", report.summary.last30DaysScore.toLocaleString(), "Performance"],
    ["Tasks Completed", String(report.summary.tasksCompleted), "Productivity"],
    ["Tasks Created", String(report.summary.tasksCreated), "Productivity"],
    ["Documents Edited", String(report.summary.documentsEdited), "Collaboration"],
    ["Files Uploaded", String(report.summary.filesUploaded), "Resources"],
    ["Comments Added", String(report.summary.commentsAdded), "Engagement"],
    ["Messages Sent", String(report.summary.messagesSent), "Communication"],
    ["Total Activities", String(report.summary.totalActivities), "Overall"],
    ["Groups Joined", String(report.summary.groupsCount), "Collaboration"],
    ["Milestones Completed", `${report.summary.milestonesCompleted}/${report.summary.totalMilestones}`, "Progress"],
  ];

  const activityRows = (report.activityTrend || []).map(
    (a) => `<tr><td>${a.label}</td><td>${a.score}</td><td>${a.tasksCompleted}</td></tr>`
  ).join("");

  const breakdown = report.contributionBreakdown || {};
  const breakdownItems = [
    { name: "Tasks Completed", value: breakdown.taskCompleted ?? 0 },
    { name: "Tasks Created", value: breakdown.taskCreated ?? 0 },
    { name: "Documents Edited", value: breakdown.documentEdited ?? 0 },
    { name: "Files Uploaded", value: breakdown.fileUploaded ?? 0 },
    { name: "Comments Added", value: breakdown.commentAdded ?? 0 },
    { name: "Messages Sent", value: breakdown.messageSent ?? 0 },
  ].filter((d) => d.value > 0);
  const breakdownRows = breakdownItems
    .map((d) => `<tr><td>${d.name}</td><td>${d.value}</td></tr>`)
    .join("");

  const groupRows = (report.groups || []).map(
    (g) => `<tr><td>${g.groupName}</td><td>${g.courseName}</td><td>${g.courseCode || "-"}</td><td>${g.role}</td></tr>`
  ).join("");

  const showRisk = report.summary.averageRiskScore > 0 || report.summary.highestRiskScore > 0;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Student Report - ${report.fullName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; color: #1a1a1a; background: #fff; padding: 40px; }
        .header { text-align: center; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 3px solid #6366f1; }
        .header h1 { font-size: 22px; font-weight: 700; color: #111827; }
        .header .subtitle { color: #6366f1; font-size: 13px; font-weight: 500; margin-top: 4px; }
        .header .meta { color: #9ca3af; font-size: 12px; margin-top: 6px; }
        h2 { font-size: 16px; font-weight: 600; color: #111827; margin: 28px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #e5e7eb; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #f3f4f6; color: #374151; text-align: left; padding: 8px 12px; font-weight: 600; border: 1px solid #e5e7eb; }
        td { padding: 8px 12px; border: 1px solid #e5e7eb; color: #4b5563; }
        tr:nth-child(even) td { background: #fafafa; }
        .num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; color: #111827; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 500; background: #eef2ff; color: #4338ca; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 8px; }
        .section { page-break-inside: avoid; }
        .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #9ca3af; }
        @media print { body { padding: 24px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SyncSpace EDU - Student Performance Report</h1>
        <div class="subtitle">${report.fullName}</div>
        <div class="meta">${report.email || ""} &nbsp;|&nbsp; Generated ${new Date(report.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
      </div>

      <div class="section">
        <h2>Summary Metrics</h2>
        <table>
          <thead><tr><th style="width:40%">Metric</th><th class="num" style="width:25%">Value</th><th>Category</th></tr></thead>
          <tbody>
            ${summaryRows.map(([m, v, c]) => `<tr><td>${m}</td><td class="num">${v}</td><td><span class="badge">${c}</span></td></tr>`).join("")}
          </tbody>
        </table>
      </div>

      ${report.activityTrend && report.activityTrend.length ? `
      <div class="section">
        <h2>Activity Trend (Last 12 Weeks)</h2>
        <table>
          <thead><tr><th>Week</th><th class="num">Score</th><th class="num">Tasks Completed</th></tr></thead>
          <tbody>${activityRows}</tbody>
        </table>
      </div>` : ""}

      <div class="grid">
        <div class="section">
          <h2>Contribution Breakdown</h2>
          <table>
            <thead><tr><th>Activity</th><th class="num">Count</th></tr></thead>
            <tbody>${breakdownRows}</tbody>
          </table>
        </div>

        <div class="section">
          <h2>Group Memberships</h2>
          <table>
            <thead><tr><th>Group</th><th>Course</th><th>Code</th><th>Role</th></tr></thead>
            <tbody>${groupRows || `<tr><td colspan="4">No group memberships found.</td></tr>`}</tbody>
          </table>
        </div>
      </div>

      ${showRisk ? `
      <div class="section">
        <h2>Risk Assessment</h2>
        <table>
          <thead><tr><th>Metric</th><th class="num">Score</th></tr></thead>
          <tbody>
            <tr><td>Average Risk Score</td><td class="num">${report.summary.averageRiskScore}</td></tr>
            <tr><td>Highest Risk Score</td><td class="num">${report.summary.highestRiskScore}</td></tr>
          </tbody>
        </table>
      </div>` : ""}

      <div class="footer">
        Report generated by SyncSpace EDU. Compiled for academic evaluation purposes.
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => { printWindow.print(); }, 500);
}

interface StudentReportExport {
  fullName: string;
  email?: string;
  generatedAt: string;
  summary: {
    totalContributionScore: number;
    last30DaysScore: number;
    tasksCompleted: number;
    tasksCreated: number;
    documentsEdited: number;
    filesUploaded: number;
    commentsAdded: number;
    messagesSent: number;
    totalActivities: number;
    milestonesCompleted: number;
    groupsCount: number;
  };
  activityTrend: { label: string; score: number; tasksCompleted: number }[];
}

interface GroupReportExport {
  groupName: string;
  members: {
    fullName: string;
    isLeader: boolean;
    totalScore: number;
    tasksCompleted: number;
    documentsEdited: number;
    filesUploaded: number;
    contributionPercent: number;
  }[];
}
