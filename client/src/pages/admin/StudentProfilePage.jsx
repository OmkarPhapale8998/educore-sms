// ============================================================
// StudentProfilePage.jsx
// One student's full profile with three tabs: Overview &
// personal details, subject-wise Attendance summary bars, and
// Documents (list + upload new files).
// ============================================================
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { studentAPI, attendanceAPI } from "../../api";
import { API_ORIGIN } from "../../api/client";
import { Badge, TableSkeleton } from "../../components/ui";
import toast from "react-hot-toast";

export const StudentProfilePage = () => {
  // Student id taken from the URL (/students/:id).
  const { id } = useParams();
  // The student record fetched from the API.
  const [student, setStudent] = useState(null);
  // Subject-wise attendance percentages for this student.
  const [attendance, setAttendance] = useState([]);
  // Which tab is open: "overview" | "attendance" | "documents".
  const [activeTab, setActiveTab] = useState("overview");
  // True while the profile data is loading.
  const [loading, setLoading] = useState(true);

  // Document upload state
  // Optional friendly title for the uploaded file.
  const [docName, setDocName] = useState("");
  // The file picked in the file input.
  const [selectedFile, setSelectedFile] = useState(null);
  // True while the upload request runs.
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Runs when the page loads and again if the URL id changes.
  useEffect(() => {
    fetchProfileData();
  }, [id]);

  // Loads the student record and attendance percentages together.
  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const [stdRes, attRes] = await Promise.all([
        studentAPI.getById(id),
        attendanceAPI.getPercentage(id)
      ]);

      if (stdRes.data.success) setStudent(stdRes.data.data);
      if (attRes.data.success) setAttendance(attRes.data.data);
    } catch (err) {
      toast.error("Failed to load student profile");
    } finally {
      setLoading(false);
    }
  };

  // Uploads the chosen file (multipart) and refreshes the documents tab.
  const handleDocUpload = async (e) => {
    e.preventDefault();
    // Step 1: make sure a file was selected.
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    // Step 2: pack the file + title into FormData for a multipart upload.
    const formData = new FormData();
    formData.append("document", selectedFile);
    formData.append("name", docName || selectedFile.name);

    setUploadingDoc(true);
    try {
      // Step 3: send to the API, clear the form, reload the profile.
      const res = await studentAPI.uploadDoc(id, formData);
      if (res.data.success) {
        toast.success("Document uploaded successfully");
        setDocName("");
        setSelectedFile(null);
        fetchProfileData();
      }
    } catch (err) {
      toast.error("Failed to upload document");
    } finally {
      setUploadingDoc(false);
    }
  };

  // While data loads show a skeleton placeholder.
  if (loading) {
    return (
      <div className="p-8">
        <TableSkeleton rows={4} cols={4} />
      </div>
    );
  }

  // Unknown id -> friendly "not found" message.
  if (!student) {
    return (
      <div className="p-12 text-center text-on-surface-variant">
        <p className="text-lg font-bold">Student not found</p>
        <Link to="/students" className="text-primary font-semibold text-xs mt-2 inline-block">
          ← Back to Students Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link to="/students" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Back to Students Directory
      </Link>

      {/* Student Banner Header */}
      <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/30 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-black text-2xl uppercase shadow-md shrink-0">
            {student.userId?.name ? student.userId.name.slice(0, 2) : "ST"}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-on-surface">{student.userId?.name}</h1>
              <Badge status={student.status} />
            </div>
            <p className="text-xs font-mono font-bold text-primary mt-1">Roll No: {student.rollNo}</p>
            <p className="text-xs text-on-surface-variant mt-1">
              {student.department} • Semester {student.semester} • Batch of {student.admissionYear}
            </p>
          </div>
        </div>

        {/* Contact action buttons (email / call) */}
        <div className="flex items-center gap-3">
          <a
            href={`mailto:${student.userId?.email}`}
            className="px-4 py-2 bg-surface-container-low text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">email</span>
            Email
          </a>
          <a
            href={`tel:${student.userId?.phone}`}
            className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-sm hover:bg-primary-container transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">call</span>
            Call
          </a>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="flex border-b border-outline-variant/30 gap-6 text-xs font-bold">
        {[
          { id: "overview", label: "Overview & Personal Details", icon: "person" },
          { id: "attendance", label: "Attendance Summary", icon: "event_available" },
          { id: "documents", label: "Documents & Files", icon: "folder" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3.5 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-200">
        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-on-surface border-b border-outline-variant/20 pb-2">
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-on-surface-variant font-semibold">Email Address</p>
                  <p className="font-bold text-on-surface mt-1">{student.userId?.email || "—"}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant font-semibold">Mobile Phone</p>
                  <p className="font-bold text-on-surface mt-1">{student.userId?.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant font-semibold">Gender</p>
                  <p className="font-bold text-on-surface mt-1">{student.gender || "—"}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant font-semibold">Category</p>
                  <p className="font-bold text-on-surface mt-1">{student.category || "General"}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant font-semibold">Date of Birth</p>
                  <p className="font-bold text-on-surface mt-1">
                    {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-on-surface-variant font-semibold">Enrolled On</p>
                  <p className="font-bold text-on-surface mt-1">
                    {new Date(student.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-on-surface border-b border-outline-variant/20 pb-2">
                Guardian & Address
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-on-surface-variant font-semibold">Guardian Name</p>
                  <p className="font-bold text-on-surface mt-1">{student.guardianName || "—"}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant font-semibold">Guardian Phone</p>
                  <p className="font-bold text-on-surface mt-1">{student.guardianPhone || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-on-surface-variant font-semibold">Residential Address</p>
                  <p className="font-bold text-on-surface mt-1">{student.address || "—"}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Attendance */}
        {activeTab === "attendance" && (
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-on-surface">Subject-wise Attendance Breakdown</h3>
              <span className="text-xs font-semibold text-on-surface-variant">Min. 75% Required</span>
            </div>

            {attendance.length === 0 ? (
              <p className="text-xs text-on-surface-variant py-8 text-center">
                No attendance records marked yet for this student.
              </p>
            ) : (
              <div className="space-y-4">
                {attendance.map((item, idx) => (
                  <div key={idx} className="p-4 bg-surface-container-low rounded-2xl space-y-2 border border-outline-variant/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-primary mr-2">
                          {item.courseCode}
                        </span>
                        <span className="font-bold text-xs text-on-surface">{item.courseName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-on-surface-variant">
                          {item.present} / {item.total} Classes
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                            item.percentage >= 75
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.percentage >= 75 ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${Math.min(100, item.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Documents */}
        {activeTab === "documents" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Document List */}
            <div className="md:col-span-2 bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-on-surface">Uploaded Documents</h3>

              {(!student.documents || student.documents.length === 0) ? (
                <p className="text-xs text-on-surface-variant py-8 text-center">
                  No documents uploaded for this student yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {student.documents.map((doc, idx) => (
                    <div key={idx} className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-xl">description</span>
                        <div>
                          <p className="font-bold text-on-surface">{doc.name}</p>
                          <p className="text-[10px] text-on-surface-variant">
                            Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`${API_ORIGIN}/${doc.path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 bg-primary text-on-primary font-bold rounded-lg text-xs hover:bg-primary-container"
                      >
                        View File
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload Box */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-on-surface">Upload New Document</h3>
              <form onSubmit={handleDocUpload} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-on-surface-variant mb-1">Document Title</label>
                  <input
                    type="text"
                    placeholder="e.g. 10th Marksheet, Aadhar Card"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface-variant mb-1">Select File (PDF / Image)</label>
                  <input
                    type="file"
                    required
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="w-full text-xs text-on-surface-variant file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-on-primary hover:file:bg-primary-container"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploadingDoc}
                  className="w-full py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow hover:bg-primary-container disabled:opacity-50"
                >
                  {uploadingDoc ? "Uploading..." : "Upload Document"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
