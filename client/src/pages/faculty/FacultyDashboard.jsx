import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { courseAPI, examAPI, noticeAPI } from "../../api";
import { StatsCard, TableSkeleton } from "../../components/ui";

export const FacultyDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFacultyData();
  }, []);

  const fetchFacultyData = async () => {
    setLoading(true);
    try {
      const [crsRes, exRes, notRes] = await Promise.all([
        courseAPI.getAll({ limit: 10 }),
        examAPI.getAll({ limit: 5 }),
        noticeAPI.getAll({ limit: 4 })
      ]);
      if (crsRes.data.success) setCourses(crsRes.data.data);
      if (exRes.data.success) setExams(exRes.data.data);
      if (notRes.data.success) setNotices(notRes.data.data);
    } catch (err) {}
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-primary text-on-primary p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold uppercase tracking-wider">
            Faculty Workspace
          </span>
          <h1 className="text-3xl font-black mt-2 tracking-tight">Welcome, {user?.name || "Professor"}!</h1>
          <p className="text-sm text-on-primary/80 mt-1">Manage lectures, mark daily attendance & evaluate student marks</p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Link
            to="/attendance"
            className="px-5 py-3 bg-white text-primary font-bold rounded-xl text-xs shadow-md hover:bg-surface-container-low transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">event_available</span>
            Mark Attendance
          </Link>
          <Link
            to="/exams"
            className="px-5 py-3 bg-white/20 text-white font-bold rounded-xl text-xs hover:bg-white/30 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">edit_note</span>
            Enter Marks
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatsCard
          title="Assigned Courses"
          value={courses.length}
          icon="school"
          color="primary"
          subtitle="Active curriculum subjects"
        />
        <StatsCard
          title="Upcoming Exams"
          value={exams.length}
          icon="quiz"
          color="secondary"
          subtitle="Scheduled this term"
        />
        <StatsCard
          title="Campus Notices"
          value={notices.length}
          icon="campaign"
          color="tertiary"
          subtitle="Circulars published"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Courses */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-on-surface">My Assigned Subjects</h2>
            <Link to="/courses" className="text-xs font-bold text-primary hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {courses.slice(0, 4).map((course) => (
              <div
                key={course._id}
                className="p-4 bg-surface-container-low rounded-2xl flex items-center justify-between border border-outline-variant/20"
              >
                <div>
                  <span className="font-mono text-xs font-bold text-primary">{course.code}</span>
                  <h4 className="text-xs font-bold text-on-surface">{course.name}</h4>
                  <p className="text-[11px] text-on-surface-variant">
                    {course.department} • Semester {course.semester} • {course.credits} Credits
                  </p>
                </div>
                <Link
                  to="/attendance"
                  className="px-3 py-1.5 bg-primary/10 text-primary font-bold rounded-lg text-xs hover:bg-primary/20"
                >
                  Take Attendance
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Notices */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-on-surface">Campus Bulletin</h2>
            <Link to="/notices" className="text-xs font-bold text-primary hover:underline">
              All Notices
            </Link>
          </div>

          <div className="space-y-3">
            {notices.map((notice) => (
              <div
                key={notice._id}
                className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-on-surface">{notice.title}</h4>
                  <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold rounded-full">
                    {notice.category}
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant line-clamp-2">{notice.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
