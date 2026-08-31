// ============================================================
// ExamsPage.jsx
// Exams & results hub: a filterable table of scheduled exams,
// a "Schedule Examination" modal, and a bulk "Enter Marks"
// modal that publishes scores for every student in one go.
// ============================================================
import React, { useState, useEffect } from "react";
import { examAPI, courseAPI, studentAPI, marksAPI } from "../../api";
import { Badge, TableSkeleton, Modal } from "../../components/ui";
import toast from "react-hot-toast";

// Options for the department dropdowns.
const DEPARTMENTS = [
  "Computer Science",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Electronics",
  "Information Technology"
];

export const ExamsPage = () => {
  // Exams shown in the table.
  const [exams, setExams] = useState([]);
  // All courses (options for the schedule-exam form).
  const [courses, setCourses] = useState([]);
  // Department filter value.
  const [department, setDepartment] = useState("");
  // Exam-type filter value.
  const [type, setType] = useState("");
  // True while exams are being fetched.
  const [loading, setLoading] = useState(true);

  // Schedule Exam Modal
  // Opens/closes the scheduling dialog.
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  // True while the create request runs.
  const [submittingExam, setSubmittingExam] = useState(false);
  // Fields of the schedule-exam form.
  const [examForm, setExamForm] = useState({
    name: "",
    type: "Mid-Term",
    course: "",
    department: "Computer Science",
    semester: "3",
    date: "",
    startTime: "10:00",
    endTime: "12:00",
    room: "A-101",
    totalMarks: "100",
    passingMarks: "40"
  });

  // Enter Marks Modal
  // The exam whose marks are being entered (null = modal closed).
  const [selectedExamForMarks, setSelectedExamForMarks] = useState(null);
  // Editable marks rows: one entry per student of the exam.
  const [marksRoster, setMarksRoster] = useState([]);
  // True while saving marks.
  const [savingMarks, setSavingMarks] = useState(false);

  // Refreshes the exam list whenever a filter changes.
  useEffect(() => {
    fetchExams();
    fetchCourses();
  }, [department, type]);

  // Fetches exams using current department/type filters.
  const fetchExams = async () => {
    setLoading(true);
    try {
      const params = {};
      if (department) params.department = department;
      if (type) params.type = type;
      const res = await examAPI.getAll(params);
      if (res.data.success) setExams(res.data.data);
    } catch (err) {
      toast.error("Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  // Loads all courses once for the schedule-exam course dropdown.
  const fetchCourses = async () => {
    try {
      const res = await courseAPI.getAll();
      if (res.data.success) setCourses(res.data.data);
    } catch (err) {}
  };

  // Creates the exam; number fields are converted before sending.
  const handleScheduleExam = async (e) => {
    e.preventDefault();
    setSubmittingExam(true);
    try {
      const res = await examAPI.create({
        ...examForm,
        semester: parseInt(examForm.semester),
        totalMarks: parseInt(examForm.totalMarks),
        passingMarks: parseInt(examForm.passingMarks),
      });

      if (res.data.success) {
        toast.success("Examination scheduled successfully!");
        setIsScheduleOpen(false);
        fetchExams();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to schedule exam");
    } finally {
      setSubmittingExam(false);
    }
  };

  // Opens the marks modal: loads the class roster + any existing marks.
  const handleOpenMarksModal = async (exam) => {
    setSelectedExamForMarks(exam);
    try {
      // Fetch students of this exam's class and saved marks in parallel.
      const [stdRes, marksRes] = await Promise.all([
        studentAPI.getAll({ department: exam.department, semester: exam.semester, limit: 100 }),
        marksAPI.getByExam(exam._id)
      ]);

      // Index already-saved marks by student id for quick lookup.
      const existingMarksMap = {};
      if (marksRes.data.success) {
        marksRes.data.data.forEach((m) => {
          existingMarksMap[m.student?._id] = m;
        });
      }

      // Build one editable row per student (pre-filled with saved marks).
      if (stdRes.data.success) {
        const roster = stdRes.data.data.map((s) => {
          const em = existingMarksMap[s._id] || {};
          return {
            studentId: s._id,
            name: s.userId?.name,
            rollNo: s.rollNo,
            theoryMarks: em.theoryMarks || 0,
            internalMarks: em.internalMarks || 0,
            practicalMarks: em.practicalMarks || 0,
            isAbsent: em.isAbsent || false
          };
        });
        setMarksRoster(roster);
      }
    } catch (err) {
      toast.error("Failed to load marks roster");
    }
  };

  // Updates a single field of a single student row in the marks table.
  const handleMarksChange = (idx, field, value) => {
    setMarksRoster((prev) => {
      const next = [...prev];
      next[idx][field] = value;
      return next;
    });
  };

  // Publishes all entered marks in one bulk request; students get notified.
  const handleSaveMarks = async () => {
    setSavingMarks(true);
    try {
      const res = await marksAPI.submitBulk({
        examId: selectedExamForMarks._id,
        marksData: marksRoster
      });

      if (res.data.success) {
        toast.success("Marks recorded and notifications sent to students!");
        setSelectedExamForMarks(null);
        fetchExams();
      }
    } catch (err) {
      toast.error("Failed to record marks");
    } finally {
      setSavingMarks(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with the "Schedule Examination" button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">Exams & Results</h1>
          <p className="text-sm text-on-surface-variant mt-1">Schedule tests, enter bulk scores & publish official marksheets</p>
        </div>

        <button
          onClick={() => setIsScheduleOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs shadow-sm hover:shadow-md hover:bg-primary-container transition-all"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          Schedule Examination
        </button>
      </div>

      {/* Filter bar: department + exam type */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col sm:flex-row gap-3">
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface font-medium focus:ring-2 focus:ring-primary"
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface font-medium focus:ring-2 focus:ring-primary"
        >
          <option value="">All Exam Types</option>
          <option value="Mid-Term">Mid-Term</option>
          <option value="Final">Final Examination</option>
          <option value="Practical">Practical Lab</option>
          <option value="Internal">Internal Assessment</option>
          <option value="Quiz">Quiz</option>
        </select>
      </div>

      {/* Exam table: loading / empty / rows */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={5} cols={6} />
          </div>
        ) : exams.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-2 text-on-surface-variant/40">quiz</span>
            <p className="text-base font-bold text-on-surface">No exams scheduled</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-4 px-6">Examination</th>
                  <th className="py-4 px-4">Course</th>
                  <th className="py-4 px-4">Dept / Sem</th>
                  <th className="py-4 px-4">Date & Time</th>
                  <th className="py-4 px-4">Room</th>
                  <th className="py-4 px-4">Total Marks</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {/* One row per scheduled exam */}
                {exams.map((exam) => (
                  <tr key={exam._id} className="hover:bg-surface-container-low/50">
                    <td className="py-3.5 px-6">
                      <p className="font-bold text-on-surface text-sm">{exam.name}</p>
                      <span className="text-[11px] font-semibold text-primary">{exam.type}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-on-surface">
                      {exam.course?.code} - {exam.course?.name}
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">
                      {exam.department} • Sem {exam.semester}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-on-surface">{new Date(exam.date).toLocaleDateString()}</p>
                      <p className="text-[11px] text-on-surface-variant">{exam.startTime} - {exam.endTime}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-on-surface">{exam.room}</td>
                    <td className="py-3.5 px-4 font-bold text-on-surface">
                      {exam.totalMarks} <span className="text-on-surface-variant font-normal">(Pass: {exam.passingMarks})</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={exam.status} />
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleOpenMarksModal(exam)}
                        className="px-3 py-1.5 bg-primary text-on-primary font-bold rounded-lg text-xs hover:bg-primary-container shadow-sm flex items-center gap-1 ml-auto"
                      >
                        <span className="material-symbols-outlined text-sm">edit_note</span>
                        Enter Marks
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Examination modal form */}
      <Modal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        title="Schedule New Examination"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleScheduleExam} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-on-surface-variant uppercase mb-1">Exam Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Mid-Term Examination - CS301"
              value={examForm.name}
              onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
              className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Exam Type</label>
              <select
                value={examForm.type}
                onChange={(e) => setExamForm({ ...examForm, type: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
              >
                <option value="Mid-Term">Mid-Term</option>
                <option value="Final">Final Examination</option>
                <option value="Practical">Practical Lab</option>
                <option value="Internal">Internal Assessment</option>
                <option value="Quiz">Quiz</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Course / Subject *</label>
              <select
                required
                value={examForm.course}
                onChange={(e) => setExamForm({ ...examForm, course: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
              >
                <option value="">Select Course</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Department</label>
              <select
                value={examForm.department}
                onChange={(e) => setExamForm({ ...examForm, department: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Semester</label>
              <select
                value={examForm.semester}
                onChange={(e) => setExamForm({ ...examForm, semester: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
              >
                {[1,2,3,4,5,6].map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Exam Date *</label>
              <input
                type="date"
                required
                value={examForm.date}
                onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Room / Hall *</label>
              <input
                type="text"
                required
                placeholder="A-101"
                value={examForm.room}
                onChange={(e) => setExamForm({ ...examForm, room: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Total Marks *</label>
              <input
                type="number"
                required
                value={examForm.totalMarks}
                onChange={(e) => setExamForm({ ...examForm, totalMarks: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface-variant uppercase mb-1">Passing Marks *</label>
              <input
                type="number"
                required
                value={examForm.passingMarks}
                onChange={(e) => setExamForm({ ...examForm, passingMarks: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={() => setIsScheduleOpen(false)}
              className="px-4 py-2 bg-surface-container text-on-surface font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingExam}
              className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs shadow hover:bg-primary-container disabled:opacity-50"
            >
              {submittingExam ? "Scheduling..." : "Schedule Exam"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Enter Marks modal: one editable row per student */}
      <Modal
        isOpen={!!selectedExamForMarks}
        onClose={() => setSelectedExamForMarks(null)}
        title={`Enter Marks — ${selectedExamForMarks?.name}`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4 text-xs">
          {/* Exam limits shown for reference while typing marks */}
          <div className="p-4 bg-surface-container-low rounded-2xl flex items-center justify-between">
            <p className="text-on-surface-variant font-medium">
              Max Marks: <strong className="text-on-surface">{selectedExamForMarks?.totalMarks}</strong> • Pass Marks: <strong className="text-on-surface">{selectedExamForMarks?.passingMarks}</strong>
            </p>
            <span className="text-[11px] text-primary font-bold">Grades & marksheets auto-calculated</span>
          </div>

          <div className="max-h-96 overflow-y-auto border border-outline-variant/20 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant font-bold sticky top-0 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Theory Marks</th>
                  <th className="py-3 px-4">Internal Marks</th>
                  <th className="py-3 px-4">Practical Marks</th>
                  <th className="py-3 px-4 text-center">Absent?</th>
                  <th className="py-3 px-4 text-right">Marksheet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {/* Marks inputs per student ("Absent?" disables the fields) */}
                {marksRoster.map((item, idx) => (
                  <tr key={item.studentId} className="hover:bg-surface-container-low/40">
                    <td className="py-2.5 px-4 font-mono font-bold text-primary">{item.rollNo}</td>
                    <td className="py-2.5 px-4 font-bold text-on-surface">{item.name}</td>
                    <td className="py-2.5 px-4">
                      <input
                        type="number"
                        min="0"
                        max={selectedExamForMarks?.totalMarks}
                        disabled={item.isAbsent}
                        value={item.theoryMarks}
                        onChange={(e) => handleMarksChange(idx, "theoryMarks", parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="number"
                        min="0"
                        disabled={item.isAbsent}
                        value={item.internalMarks}
                        onChange={(e) => handleMarksChange(idx, "internalMarks", parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="number"
                        min="0"
                        disabled={item.isAbsent}
                        value={item.practicalMarks}
                        onChange={(e) => handleMarksChange(idx, "practicalMarks", parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={item.isAbsent}
                        onChange={(e) => handleMarksChange(idx, "isAbsent", e.target.checked)}
                        className="rounded text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <a
                        href={marksAPI.getMarksheetUrl(item.studentId, selectedExamForMarks?._id)}
                        target="_blank"
                        rel="noreferrer"
                        title="Download Marksheet PDF"
                        className="p-1 text-primary hover:bg-primary/10 rounded inline-block"
                      >
                        <span className="material-symbols-outlined text-base">download</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
            <button
              onClick={() => setSelectedExamForMarks(null)}
              className="px-4 py-2 bg-surface-container text-on-surface font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveMarks}
              disabled={savingMarks}
              className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs shadow hover:bg-primary-container disabled:opacity-50 flex items-center gap-2"
            >
              {savingMarks ? "Publishing Marks..." : "Publish & Notify Students"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
