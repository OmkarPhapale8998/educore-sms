// ============================================================
// DashboardPage.jsx
// Admin home screen: shows summary cards (students, faculty,
// today's attendance) and a department distribution pie chart.
// ============================================================
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { reportAPI, examAPI, noticeAPI } from "../../api";
import { StatsCard, Badge } from "../../components/ui";

// Colors cycled through the pie chart slices.
const PIE_COLORS = ["#00236f", "#006591", "#39b8fd", "#ffb95f", "#3e2400", "#757682"];

export const DashboardPage = () => {
  // Totals for the KPI cards (students, faculty, today's attendance %).
  const [summary, setSummary] = useState(null);
  // Enrollment-per-year data (kept for future charts).
  const [enrollmentData, setEnrollmentData] = useState([]);
  // Student count per department - feeds the pie chart.
  const [deptData, setDeptData] = useState([]);
  // Next few exams for the "Upcoming" list.
  const [upcomingExams, setUpcomingExams] = useState([]);
  // Latest notices for the bulletin preview.
  const [recentNotices, setRecentNotices] = useState([]);
  // True while the dashboard data is loading.
  const [loading, setLoading] = useState(true);

  // Runs once when the page loads.
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Loads every dashboard number in parallel (summary, charts, exams, notices).
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, enrollRes, deptRes, examRes, noticeRes] = await Promise.all([
        reportAPI.getDashboardSummary(),
        reportAPI.getEnrollmentTrend(),
        reportAPI.getDeptDistribution(),
        examAPI.getAll({ limit: 4 }),
        noticeAPI.getAll({ limit: 4 }),
      ]);

      if (sumRes.data.success) setSummary(sumRes.data.data);
      if (enrollRes.data.success) setEnrollmentData(enrollRes.data.data);
      if (deptRes.data.success) setDeptData(deptRes.data.data);
      if (examRes.data.success) setUpcomingExams(examRes.data.data.slice(0, 3));
      if (noticeRes.data.success) setRecentNotices(noticeRes.data.data.slice(0, 3));
    } catch (err) {
      console.error("Dashboard data error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
            Academic Overview
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Real-time analytics and institutional performance metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/students/add"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs shadow-sm hover:shadow-md hover:bg-primary-container transition-all"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            Add Student
          </Link>
          <Link
            to="/attendance"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-container text-on-surface font-bold rounded-xl text-xs hover:bg-surface-container-high transition-all"
          >
            <span className="material-symbols-outlined text-base">event_available</span>
            Mark Attendance
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatsCard
          title="Total Students"
          value={summary?.totalStudents || 0}
          icon="group"
          color="primary"
          change="+8.4%"
          subtitle="Enrolled active students"
        />
        <StatsCard
          title="Faculty Members"
          value={summary?.totalFaculty || 0}
          icon="badge"
          color="secondary"
          subtitle="Full-time & visiting"
        />
        <StatsCard
          title="Today's Attendance"
          value={`${summary?.todayAttendancePercent || 0}%`}
          icon="check_circle"
          color="tertiary"
          subtitle="Campus-wide average"
        />
      </div>

      {/* Department Breakdown Chart */}
      <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-on-surface">Department Breakdown</h2>
          <p className="text-xs text-on-surface-variant">Student count per branch</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mt-4">
          {/* Pie chart (falls back to sample data until the API responds) */}
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deptData.length > 0 ? deptData : [
                    { department: "Computer Science", count: 45 },
                    { department: "Mechanical Engg", count: 32 },
                    { department: "Civil Engg", count: 28 },
                    { department: "Electrical Engg", count: 25 },
                  ]}
                  dataKey="count"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {(deptData.length > 0 ? deptData : [1,2,3,4]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Color-coded legend listing each department and its count */}
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {(deptData.length > 0 ? deptData : [
              { department: "Computer Science", count: 45 },
              { department: "Mechanical Engg", count: 32 },
              { department: "Civil Engg", count: 28 },
            ]).map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs border-b border-outline-variant/20 pb-1.5 last:border-b-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-on-surface-variant truncate">{d.department}</span>
                </div>
                <span className="font-bold text-on-surface">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Section: Upcoming Exams & Recent Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Exams */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-on-surface">Upcoming Examinations</h2>
            <Link to="/exams" className="text-xs font-bold text-primary hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingExams.length === 0 ? (
              <p className="text-xs text-on-surface-variant py-4 text-center">No exams scheduled currently</p>
            ) : (
              upcomingExams.map((exam) => (
                <div
                  key={exam._id}
                  className="p-3.5 bg-surface-container-low rounded-2xl flex items-center justify-between gap-3 border border-outline-variant/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {new Date(exam.date).getDate()}
                      <br />
                      <span className="text-[9px] uppercase">{new Date(exam.date).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-on-surface">{exam.name}</h4>
                      <p className="text-[11px] text-on-surface-variant">
                        {exam.course?.code} • {exam.startTime} - {exam.endTime} • Room {exam.room}
                      </p>
                    </div>
                  </div>
                  <Badge status={exam.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Notices */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-on-surface">Official Notices</h2>
            <Link to="/notices" className="text-xs font-bold text-primary hover:underline">
              View Bulletin
            </Link>
          </div>

          <div className="space-y-3">
            {recentNotices.length === 0 ? (
              <p className="text-xs text-on-surface-variant py-4 text-center">No active notices</p>
            ) : (
              recentNotices.map((notice) => (
                <div
                  key={notice._id}
                  className="p-3.5 bg-surface-container-low rounded-2xl flex items-start gap-3 border border-outline-variant/20"
                >
                  <span className="material-symbols-outlined text-primary text-xl mt-0.5">
                    {notice.isPinned ? "push_pin" : "campaign"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-on-surface truncate">{notice.title}</h4>
                      <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold rounded-full">
                        {notice.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-1">
                      {notice.description}
                    </p>
                    <p className="text-[10px] text-on-surface-variant/60 mt-1">
                      Posted by {notice.postedBy?.name || "Admin"} • {new Date(notice.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
