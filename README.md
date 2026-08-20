# EduCore SMS — Full-Stack Student Management System

A full-stack Student Management System web application tailored for Diploma Engineering colleges, featuring real-time analytics, role-based access control (Admin, Faculty, Student), attendance tracking with auto-alerts, fee management with PDF receipts, examination marksheets with automated grading, and campus circular notices.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Recharts, Lucide Icons, Material Symbols, Axios, React Hot Toast
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), JWT authentication (httpOnly cookie + Bearer), Multer, PDFKit, ExcelJS, Nodemailer

---

## 🚀 Quick Start Guide

### 1. Backend Setup (`server/`)
```bash
cd server
npm install
```
Configure your MongoDB connection in `server/.env` (default is `mongodb://localhost:27017/educore` or your MongoDB Atlas URI).

To seed demo accounts, courses, faculty, students, exams, fees, and notices:
```bash
npm run seed
```

Start the API server:
```bash
npm run dev
# Server running at http://localhost:5000
```

### 2. Frontend Setup (`client/`)
```bash
cd client
npm install
npm run dev
# Frontend running at http://localhost:5173
```

---

## 👥 Demo Logins

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@educore.edu` | `Admin@1234` |
| **Faculty** | `priya@educore.edu` | `Faculty@1234` |
| **Student** | `aarav.mehta@student.educore.edu` | `Student@1234` |

*(Quick-fill demo buttons are built right into the Login page!)*

---

## ✨ Features Implemented

1. **Authentication & RBAC**: JWT tokens, bcrypt password hashing, reset password with email link, protected routes.
2. **Students Directory**: Department/Semester/Status filters, search with debounce, pagination, Excel export.
3. **Multi-step Student Enrollment**: 3-step wizard with live validation.
4. **Student Profile**: Overview, subject-wise attendance breakdown, fee ledger with PDF receipts, document uploads.
5. **Faculty Directory**: Faculty list, qualifications, designations, and department assignment.
6. **Curriculum & Courses**: Subject credits, syllabus unit tracking, assigned faculty.
7. **Attendance Module**: Class roster loading, quick toggles (Present/Absent/Leave), real-time attendance percentage counter, auto-notifications for attendance < 75%.
8. **Fee Management**: Summary KPI cards, record partial/full payments with receipt numbers, direct PDF receipt generation.
9. **Exams & Marksheets**: Schedule exams, bulk enter theory/internal/practical marks, auto grade calculation, download PDF marksheets.
10. **Notice Board**: Category filtering, pinned notices, file attachments.
11. **Reports & Analytics**: Recharts charts for enrollment growth, department breakdown, weekly attendance trends, and fee collection velocity.
12. **Settings**: Profile photo upload, password change, institutional security.
13. **Faculty & Student Portals**: Dedicated workspaces tailored to each user role.
