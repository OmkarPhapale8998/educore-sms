-- EduCore SMS - PostgreSQL (Supabase) schema
create extension if not exists "pgcrypto";

drop table if exists timetable_slots, timetables, notifications, notices,
  marks, exams, attendances, syllabus_materials, syllabus_units, faculty_courses, courses,
  faculties, student_documents, students, users cascade;

create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password text not null,
  role text not null default 'student' check (role in ('admin','faculty','student')),
  phone text default '',
  photo text not null default '',
  is_active boolean not null default true,
  reset_password_token text,
  reset_password_expire timestamptz,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  roll_no text not null unique,
  department text check (department in ('Computer Science','Mechanical Engineering','Civil Engineering','Electrical Engineering','Electronics','Information Technology','Automobile Engineering')),
  semester int check (semester between 1 and 8),
  admission_year int not null,
  guardian_name text default '',
  guardian_phone text default '',
  address text default '',
  date_of_birth date,
  gender text check (gender in ('Male','Female','Other')),
  category text check (category in ('General','OBC','SC','ST','EWS')),
  status text not null default 'active' check (status in ('active','inactive','graduated','dropped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table student_documents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  name text not null,
  path text not null,
  uploaded_at timestamptz not null default now()
);

create table faculties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  employee_id text not null unique,
  department text not null check (department in ('Computer Science','Mechanical Engineering','Civil Engineering','Electrical Engineering','Electronics','Information Technology','Automobile Engineering')),
  designation text not null default 'Assistant Professor',
  qualification text[] not null default '{}',
  joining_date date not null default current_date,
  experience numeric not null default 0,
  status text not null default 'active' check (status in ('active','inactive','on_leave')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  department text not null check (department in ('Computer Science','Mechanical Engineering','Civil Engineering','Electrical Engineering','Electronics','Information Technology','Automobile Engineering')),
  semester int not null check (semester between 1 and 8),
  credits int not null,
  type text not null default 'Theory' check (type in ('Theory','Practical','Both')),
  assigned_faculty_id uuid references faculties(id) on delete set null,
  syllabus_file text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table faculty_courses (
  faculty_id uuid not null references faculties(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  primary key (faculty_id, course_id)
);

create table syllabus_units (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  description text default '',
  completed boolean not null default false,
  position int not null default 0
);

create table syllabus_materials (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references syllabus_units(id) on delete cascade,
  name text not null,
  path text not null
);

create table exams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('Mid-Term','Final','Practical','Internal','Quiz')),
  course_id uuid not null references courses(id) on delete cascade,
  department text not null,
  semester int not null,
  date date not null,
  start_time text not null,
  end_time text not null,
  room text not null,
  total_marks int not null,
  passing_marks int not null,
  status text not null default 'scheduled' check (status in ('scheduled','ongoing','completed','cancelled')),
  instructions text default '',
  created_at timestamptz not null default now()
);

create table attendances (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  marked_by uuid references faculties(id) on delete set null,
  date date not null,
  status text not null check (status in ('present','absent','leave')),
  department text,
  semester int,
  remarks text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, course_id, date)
);
create index idx_attendance_date on attendances(date);
create index idx_attendance_student on attendances(student_id);

create table marks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  exam_id uuid not null references exams(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  theory_marks numeric not null default 0,
  internal_marks numeric not null default 0,
  practical_marks numeric not null default 0,
  total_obtained numeric not null default 0,
  total_maximum numeric not null,
  percentage numeric not null default 0,
  grade text not null default 'F',
  grade_points numeric not null default 0,
  is_absent boolean not null default false,
  entered_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, exam_id)
);

create table notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null default 'General' check (category in ('General','Exam','Event','Holiday','Academic','Urgent')),
  posted_by uuid references users(id) on delete set null,
  target_audience text not null default 'all' check (target_audience in ('all','students','faculty','admin')),
  department text not null default 'all',
  attachment_name text,
  attachment_path text,
  is_pinned boolean not null default false,
  is_published boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_notices_created on notices(created_at desc);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient uuid not null references users(id) on delete cascade,
  type text not null check (type in ('low_attendance','new_notice','marks_published','exam_scheduled','general')),
  title text not null,
  message text not null,
  related_id uuid,
  related_model text,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_notifications_recipient on notifications(recipient, is_read, created_at desc);

create table timetables (
  id uuid primary key default gen_random_uuid(),
  department text not null,
  semester int not null,
  academic_year text not null,
  day text not null check (day in ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (department, semester, academic_year, day)
);

create table timetable_slots (
  id uuid primary key default gen_random_uuid(),
  timetable_id uuid not null references timetables(id) on delete cascade,
  start_time text not null,
  end_time text not null,
  course_id uuid references courses(id) on delete set null,
  faculty_id uuid references faculties(id) on delete set null,
  room text,
  type text not null default 'lecture' check (type in ('lecture','lab','tutorial','break'))
);

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_users_updated before update on users for each row execute function set_updated_at();
create trigger trg_students_updated before update on students for each row execute function set_updated_at();
create trigger trg_faculties_updated before update on faculties for each row execute function set_updated_at();
create trigger trg_courses_updated before update on courses for each row execute function set_updated_at();
create trigger trg_attendances_updated before update on attendances for each row execute function set_updated_at();
create trigger trg_marks_updated before update on marks for each row execute function set_updated_at();
create trigger trg_notices_updated before update on notices for each row execute function set_updated_at();

