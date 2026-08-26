// ============================================================
// index.js
// One place listing every backend endpoint the frontend calls,
// grouped by feature (auth, students, faculty, courses,
// attendance, exams, marks, notices, notifications, reports).
// Pages import these helpers instead of writing URLs by hand.
// ============================================================
import API from "./client";

// Login, register, logout, password reset and profile endpoints.
export const authAPI = {
  login: (data) => API.post("/auth/login", data),
  register: (data) => API.post("/auth/register", data),
  logout: () => API.post("/auth/logout"),
  getMe: () => API.get("/auth/me"),
  updateProfile: (data) => API.put("/auth/update-profile", data, { headers: { "Content-Type": "multipart/form-data" } }),
  changePassword: (data) => API.put("/auth/change-password", data),
  forgotPassword: (data) => API.post("/auth/forgot-password", data),
  resetPassword: (token, data) => API.post(`/auth/reset-password/${token}`, data),
};

// Student records: list/create/update/delete + documents and attendance summary.
export const studentAPI = {
  getAll: (params) => API.get("/students", { params }),
  getById: (id) => API.get(`/students/${id}`),
  create: (data) => API.post("/students", data),
  update: (id, data) => API.put(`/students/${id}`, data),
  delete: (id) => API.delete(`/students/${id}`),
  uploadDoc: (id, formData) => API.post(`/students/${id}/documents`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  getAttendanceSummary: (id) => API.get(`/students/${id}/attendance-summary`),
};

// Teaching staff records.
export const facultyAPI = {
  getAll: (params) => API.get("/faculty", { params }),
  getById: (id) => API.get(`/faculty/${id}`),
  create: (data) => API.post("/faculty", data),
  update: (id, data) => API.put(`/faculty/${id}`, data),
  delete: (id) => API.delete(`/faculty/${id}`),
};

// Course catalog incl. syllabus units and syllabus file upload.
export const courseAPI = {
  getAll: (params) => API.get("/courses", { params }),
  getById: (id) => API.get(`/courses/${id}`),
  create: (data) => API.post("/courses", data),
  update: (id, data) => API.put(`/courses/${id}`, data),
  delete: (id) => API.delete(`/courses/${id}`),
  updateUnit: (id, unitId, data) => API.patch(`/courses/${id}/syllabus-unit/${unitId}`, data),
  uploadSyllabus: (id, formData) => API.post(`/courses/${id}/syllabus`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
};

// Marking daily attendance and reading its history / percentages.
export const attendanceAPI = {
  mark: (data) => API.post("/attendance/mark", data),
  get: (params) => API.get("/attendance", { params }),
  getPercentage: (studentId) => API.get(`/attendance/percentage/${studentId}`),
  getTodaySummary: () => API.get("/attendance/today"),
};

// Exam scheduling.
export const examAPI = {
  getAll: (params) => API.get("/exams", { params }),
  getById: (id) => API.get(`/exams/${id}`),
  create: (data) => API.post("/exams", data),
  update: (id, data) => API.put(`/exams/${id}`, data),
  delete: (id) => API.delete(`/exams/${id}`),
};

// Entering marks per exam/student and building marksheet PDF links.
export const marksAPI = {
  getByExam: (examId) => API.get(`/marks/exam/${examId}`),
  getByStudent: (studentId) => API.get(`/marks/student/${studentId}`),
  submitBulk: (data) => API.post("/marks/bulk", data),
  getMarksheetUrl: (studentId, examId) => `${API.defaults.baseURL}/marks/report/${studentId}/${examId}`,
};

// Campus notice board (create with attachment, pin/unpin, delete).
export const noticeAPI = {
  getAll: (params) => API.get("/notices", { params }),
  getById: (id) => API.get(`/notices/${id}`),
  create: (formData) => API.post("/notices", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id, data) => API.put(`/notices/${id}`, data),
  togglePin: (id) => API.patch(`/notices/${id}/pin`),
  delete: (id) => API.delete(`/notices/${id}`),
};

// Per-user notification bell (list, mark one/all as read).
export const notificationAPI = {
  getMy: () => API.get("/notifications/me"),
  markRead: (id) => API.patch(`/notifications/${id}/read`),
  markAllRead: () => API.patch("/notifications/mark-all-read"),
};

// Analytics for dashboard charts plus Excel export links.
export const reportAPI = {
  getEnrollmentTrend: () => API.get("/reports/enrollment-trend"),
  getDeptDistribution: () => API.get("/reports/department-distribution"),
  getPassRate: (examId) => API.get("/reports/pass-rate", { params: { examId } }),
  getDashboardSummary: () => API.get("/reports/dashboard-summary"),
  getExportStudentsUrl: (params) => `${API.defaults.baseURL}/reports/export/students?${new URLSearchParams(params).toString()}`,
};
