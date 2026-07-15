import api from "./api";

export interface Course {
  id: string;
  courseCode: string;
  courseName: string;
  semester: string;
  instructorId: string;
  instructorName: string;
  groupCount: number;
}

export interface CourseDetail extends Course {
  projectGroups: ProjectGroupSummary[];
}

export interface ProjectGroupSummary {
  id: string;
  groupName: string;
  leaderId: string;
  leaderName: string;
  memberCount: number;
  workspaceCount: number;
  milestoneCount: number;
}

export async function getCourses(): Promise<Course[]> {
  const res = await api.get<{ data: Course[] }>("/course");
  return res.data.data;
}

export async function getCourse(id: string): Promise<CourseDetail> {
  const res = await api.get<{ data: CourseDetail }>(`/course/${id}`);
  return res.data.data;
}

export async function createCourse(data: { courseCode: string; courseName: string; semester: string }): Promise<Course> {
  const res = await api.post<{ data: Course }>("/course", data);
  return res.data.data;
}

export async function updateCourse(id: string, data: { courseCode?: string; courseName?: string; semester?: string }): Promise<Course> {
  const res = await api.put<{ data: Course }>(`/course/${id}`, data);
  return res.data.data;
}

export async function deleteCourse(id: string): Promise<void> {
  await api.delete(`/course/${id}`);
}
