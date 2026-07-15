import * as XLSX from "xlsx";

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
