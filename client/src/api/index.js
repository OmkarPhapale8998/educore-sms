import API from "./client";

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

export const studentAPI = {
  getAll: (params) => API.get("/students", { params }),
  getById: (id) => API.get(`/students/${id}`),
  create: (data) => API.post("/students", data),
  update: (id, data) => API.put(`/students/${id}`, data),
  delete: (id) => API.delete(`/students/${id}`),
  uploadDoc: (id, formData) => API.post(`/students/${id}/documents`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  getAttendanceSummary: (id) => API.get(`/students/${id}/attendance-summary`),
};

export const facultyAPI = {
  getAll: (params) => API.get("/faculty", { params }),
  getById: (id) => API.get(`/faculty/${id}`),
  create: (data) => API.post("/faculty", data),
  update: (id, data) => API.put(`/faculty/${id}`, data),
  delete: (id) => API.delete(`/faculty/${id}`),
};

export const courseAPI = {
  getAll: (params) => API.get("/courses", { params }),
  getById: (id) => API.get(`/courses/${id}`),
  create: (data) => API.post("/courses", data),
  update: (id, data) => API.put(`/courses/${id}`, data),
  delete: (id) => API.delete(`/courses/${id}`),
  updateUnit: (id, unitId, data) => API.patch(`/courses/${id}/syllabus-unit/${unitId}`, data),
  uploadSyllabus: (id, formData) => API.post(`/courses/${id}/syllabus`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
};

export const attendanceAPI = {
  mark: (data) => API.post("/attendance/mark", data),
  get: (params) => API.get("/attendance", { params }),
  getPercentage: (studentId) => API.get(`/attendance/percentage/${studentId}`),
  getTodaySummary: () => API.get("/attendance/today"),
};

export const feeAPI = {
  getAll: (params) => API.get("/fees", { params }),
  getById: (id) => API.get(`/fees/${id}`),
  create: (data) => API.post("/fees", data),
  collect: (id, data) => API.post(`/fees/${id}/collect`, data),
  getReceiptUrl: (id, receiptNo) => `${API.defaults.baseURL}/fees/${id}/receipt/${receiptNo}`,
};

export const examAPI = {
  getAll: (params) => API.get("/exams", { params }),
  getById: (id) => API.get(`/exams/${id}`),
  create: (data) => API.post("/exams", data),
  update: (id, data) => API.put(`/exams/${id}`, data),
  delete: (id) => API.delete(`/exams/${id}`),
};

export const marksAPI = {
  getByExam: (examId) => API.get(`/marks/exam/${examId}`),
  getByStudent: (studentId) => API.get(`/marks/student/${studentId}`),
  submitBulk: (data) => API.post("/marks/bulk", data),
  getMarksheetUrl: (studentId, examId) => `${API.defaults.baseURL}/marks/report/${studentId}/${examId}`,
};

export const noticeAPI = {
  getAll: (params) => API.get("/notices", { params }),
  getById: (id) => API.get(`/notices/${id}`),
  create: (formData) => API.post("/notices", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id, data) => API.put(`/notices/${id}`, data),
  togglePin: (id) => API.patch(`/notices/${id}/pin`),
  delete: (id) => API.delete(`/notices/${id}`),
};

export const notificationAPI = {
  getMy: () => API.get("/notifications/me"),
  markRead: (id) => API.patch(`/notifications/${id}/read`),
  markAllRead: () => API.patch("/notifications/mark-all-read"),
};

export const reportAPI = {
  getEnrollmentTrend: () => API.get("/reports/enrollment-trend"),
  getDeptDistribution: () => API.get("/reports/department-distribution"),
  getAttendanceTrend: (weeks) => API.get("/reports/attendance-trend", { params: { weeks } }),
  getFeeTrend: () => API.get("/reports/fee-collection-trend"),
  getPassRate: (examId) => API.get("/reports/pass-rate", { params: { examId } }),
  getDashboardSummary: () => API.get("/reports/dashboard-summary"),
  getExportStudentsUrl: (params) => `${API.defaults.baseURL}/reports/export/students?${new URLSearchParams(params).toString()}`,
};
