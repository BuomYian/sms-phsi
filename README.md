<div align="center">

# 🏥 PHSI — School Management System

**Presbyterian Health Science Institute · Juba, South Sudan**

_"Training Health Professionals for a Healthier South Sudan"_

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)

</div>

---

## Overview

A comprehensive, full-stack **School Management System** built for the Presbyterian Health Science Institute (PHSI) in Juba, South Sudan. The platform manages the complete academic lifecycle — from student admissions and course enrollment to grading, fee management, and institutional reporting — designed for low-bandwidth environments common in the region.

### Key Highlights

- **6 User Roles** — Super Admin, Admin, Finance Officer, Instructor, Student, Parent
- **16 Feature Modules** — Dashboard, Students, Staff, Academics, Enrollment, Timetable, Attendance, Grades, Fees & Finance, Announcements, Messages, Reports, Settings, and more
- **26 Database Models** — Comprehensive relational schema covering all institutional data
- **Role-Based Access Control (RBAC)** — Granular permissions per route and server action
- **Offline-First Mindset** — Lightweight pages, minimal client JS, optimized for slow connections

---

## Tech Stack

| Layer            | Technology                                                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**    | [Next.js 16](https://nextjs.org) (App Router, React Server Components)                                                           |
| **Language**     | [TypeScript 5](https://typescriptlang.org) (strict mode)                                                                         |
| **UI**           | [React 19](https://react.dev), [Tailwind CSS v4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com) (33 components)    |
| **Database**     | [PostgreSQL](https://postgresql.org) via [Supabase](https://supabase.com)                                                        |
| **ORM**          | [Prisma 6](https://prisma.io)                                                                                                    |
| **Auth**         | Custom JWT (HTTP-only cookies) with [jose](https://github.com/panva/jose) + [bcryptjs](https://github.com/nicolo-ribaudo/bcrypt) |
| **File Storage** | [Cloudinary](https://cloudinary.com) (next-cloudinary)                                                                           |
| **Forms**        | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) validation                                               |
| **Tables**       | [TanStack Table v8](https://tanstack.com/table)                                                                                  |
| **Charts**       | [Recharts](https://recharts.org)                                                                                                 |
| **PDF Export**   | [@react-pdf/renderer](https://react-pdf.org)                                                                                     |
| **CSV Import**   | [PapaParse](https://papaparse.com)                                                                                               |

---

## Project Structure

```
sms-phsi/
├── prisma/
│   ├── schema.prisma          # 26 database models
│   └── seed.ts                # Initial data (departments, programs, subjects, admin user)
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/         # Login page + server action
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/     # Role-specific dashboards
│   │   │   ├── students/      # Student CRUD, import, detail view
│   │   │   ├── staff/         # Staff management
│   │   │   ├── academics/     # Programs, subjects, departments, calendar
│   │   │   ├── enrollment/    # Course enrollment & approvals
│   │   │   ├── timetable/     # Weekly schedule grid
│   │   │   ├── attendance/    # Attendance marking & history
│   │   │   ├── grades/        # Grade entry, review, transcripts, exams
│   │   │   ├── fees/          # Fee structures, payments, scholarships
│   │   │   ├── announcements/ # Institutional announcements
│   │   │   ├── messages/      # Internal messaging
│   │   │   ├── reports/       # Analytics & reporting dashboards
│   │   │   └── settings/      # System configuration, users, audit log
│   │   ├── layout.tsx         # Root layout with providers
│   │   └── page.tsx           # Root redirect → /login
│   ├── components/
│   │   ├── ui/                # 33 shadcn/ui primitives
│   │   ├── dashboard/         # Stat cards, recent activity
│   │   ├── app-sidebar.tsx    # Dynamic nav sidebar (role-filtered)
│   │   ├── topbar.tsx         # Top navigation bar
│   │   ├── data-table.tsx     # Reusable data table with search & pagination
│   │   └── providers.tsx      # Theme + Toaster providers
│   ├── lib/
│   │   ├── auth/              # Session management, password hashing, RBAC
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── audit.ts           # Audit logging utility
│   │   ├── validators.ts      # Zod schemas for all forms
│   │   └── utils.ts           # Formatters, ID generators, GPA calculator
│   ├── types/
│   │   └── index.ts           # Enums & interfaces (Role, Status, NavItem, etc.)
│   ├── constants/
│   │   └── index.ts           # Nav items, grading scale, app constants
│   └── middleware.ts          # Route protection & role-based redirects
├── .env.example               # Environment variable template
├── package.json
└── tsconfig.json
```

---

## Feature Modules

### 🏠 Dashboard

Role-specific dashboards with KPI cards, recent activity, and quick links. Each role (Admin, Instructor, Student, Finance) sees only relevant data.

### 👨‍🎓 Student Management

- Full CRUD with student ID generation (`PHSI/2026/0001`)
- CSV bulk import with preview
- Detailed student profiles (personal, academic, medical, guardian info)
- Status management (Active, Suspended, Withdrawn, Graduated, Deferred)

### 👨‍🏫 Staff Management

- Staff registration with auto-generated IDs
- Department assignment and designation tracking
- Employment type management (Full-Time, Part-Time, Contract)

### 📚 Academics

- **Programs** — Define degree programs with duration, credits, and entry requirements
- **Subjects** — Manage courses with credit hours, semester numbers, and types (Core/Elective)
- **Departments** — Organize academic units with department heads
- **Academic Calendar** — Semester and academic year management

### 📝 Enrollment

- Semester-based course enrollment
- Approval workflows (Pending → Approved/Rejected)
- Course enrollment tracking

### 📅 Timetable

- Weekly schedule grid (Monday–Saturday)
- Room and instructor assignment
- Filterable by instructor and semester

### ✅ Attendance

- Mark attendance per course session (Present, Absent, Late, Excused)
- Attendance history with filtering
- Threshold-based warnings (default: 75%)

### 📊 Grades

- **Grade Entry** — Instructors enter CA marks (40%) and exam marks (60%)
- **Grade Review** — Admin approval workflow (Draft → Submitted → Approved)
- **My Results** — Student portal for viewing semester results and GPA
- **Transcripts** — Cumulative GPA calculation across all semesters
- **Exam Schedule** — Exam date, venue, and duration management

### 💰 Fees & Finance

- **Fee Structures** — Define fees by program, semester, and category (Tuition, Lab, Library, etc.)
- **Student Accounts** — Per-student billing with balance tracking
- **Payment Recording** — Cash, Bank Transfer, Mobile Money with auto-receipt generation
- **Scholarships** — Track sponsorships and fee waivers
- **My Fees** — Student portal for viewing fees and payment history
- **Financial Reports** — Revenue analytics and payment method breakdowns

### 📢 Announcements

- Targeted announcements by audience (All, Students, Staff, specific programs)
- Publish/expiry date scheduling

### ✉️ Messages

- Internal messaging system between users
- Inbox/Sent views with unread indicators

### 📈 Reports

- Student analytics (enrollment, gender, status distribution)
- Staff reports (by department, role)
- Academic performance (grade distribution, program stats)
- Financial summaries (revenue KPIs, payment methods)
- Attendance analytics
- Institutional summary dashboard (12 KPI cards)

### ⚙️ Settings

- Institution configuration
- Academic settings (grading weights, credit limits, attendance thresholds)
- Fee settings
- User management (create, activate/deactivate)
- Audit log (tracks all system actions)

---

## Database Schema

26 models organized into logical domains:

| Domain                 | Models                                                               |
| ---------------------- | -------------------------------------------------------------------- |
| **Users & Auth**       | User, Student, Staff, ParentStudent                                  |
| **Academic Structure** | Department, Program, Subject, SubjectPrerequisite, SubjectInstructor |
| **Academic Calendar**  | AcademicYear, Semester                                               |
| **Enrollment**         | Enrollment, CourseEnrollment                                         |
| **Scheduling**         | TimetableEntry                                                       |
| **Assessment**         | Attendance, Grade, ExamSchedule                                      |
| **Finance**            | FeeStructure, StudentFee, Payment, Scholarship                       |
| **Communication**      | Announcement, Message                                                |
| **System**             | Document, AuditLog, Setting                                          |

### Grading Scale

| Letter | Score Range | GPA Points | Description   |
| ------ | ----------- | ---------- | ------------- |
| A      | 70–100      | 4.0        | Excellent     |
| B+     | 65–69       | 3.5        | Very Good     |
| B      | 60–64       | 3.0        | Good          |
| C+     | 55–59       | 2.5        | Fairly Good   |
| C      | 50–54       | 2.0        | Average       |
| D      | 45–49       | 1.5        | Below Average |
| F      | 0–44        | 0.0        | Fail          |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20.9.0
- **PostgreSQL** database (or [Supabase](https://supabase.com) free tier)
- **Cloudinary** account (for file uploads — optional)

### 1. Clone & Install

```bash
git clone <repository-url>
cd sms-phsi
npm install
```

### 2. Configure Environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

| Variable                            | Description                                            |
| ----------------------------------- | ------------------------------------------------------ |
| `DATABASE_URL`                      | Supabase pooled connection string (for Prisma Client)  |
| `DIRECT_URL`                        | Supabase direct connection string (for Prisma Migrate) |
| `JWT_SECRET`                        | Random 256-bit secret for JWT signing                  |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name                                  |
| `CLOUDINARY_API_KEY`                | Cloudinary API key                                     |
| `CLOUDINARY_API_SECRET`             | Cloudinary API secret                                  |
| `NEXT_PUBLIC_APP_URL`               | Application URL (default: `http://localhost:3000`)     |

### 3. Set Up Database

Generate the Prisma client and push the schema to your database:

```bash
npx prisma generate
npx prisma db push
```

### 4. Seed Initial Data

Populates departments, programs, subjects, academic year, semesters, default settings, and a Super Admin user:

```bash
npx prisma db seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Default Login

| Field    | Value               |
| -------- | ------------------- |
| Email    | `admin@phsi.edu.ss` |
| Password | `PHSI@2025`         |

> ⚠️ **Change the default password immediately after first login.**

---

## Available Scripts

| Command               | Description                              |
| --------------------- | ---------------------------------------- |
| `npm run dev`         | Start development server with hot reload |
| `npm run build`       | Create optimized production build        |
| `npm run start`       | Start production server                  |
| `npm run lint`        | Run ESLint                               |
| `npx prisma studio`   | Open Prisma database GUI                 |
| `npx prisma db push`  | Push schema changes to database          |
| `npx prisma db seed`  | Seed database with initial data          |
| `npx prisma generate` | Regenerate Prisma Client                 |

---

## Authentication & Authorization

### Auth Flow

1. User submits credentials on `/login`
2. Server action validates against hashed password (bcryptjs, cost 12)
3. On success, creates a signed JWT (HS256, jose) containing user ID, role, email, and name
4. JWT stored in HTTP-only cookie (`phsi-session`, 7-day expiry)
5. Middleware validates the cookie on every request and enforces route permissions

### Role Permissions

| Route         | Super Admin | Admin | Finance | Instructor | Student | Parent |
| ------------- | :---------: | :---: | :-----: | :--------: | :-----: | :----: |
| Dashboard     |     ✅      |  ✅   |   ✅    |     ✅     |   ✅    |   ✅   |
| Students      |     ✅      |  ✅   |    —    |     ✅     |    —    |   —    |
| Staff         |     ✅      |  ✅   |    —    |     —      |    —    |   —    |
| Academics     |     ✅      |  ✅   |    —    |     ✅     |    —    |   —    |
| Enrollment    |     ✅      |  ✅   |    —    |     —      |    —    |   —    |
| Timetable     |     ✅      |  ✅   |    —    |     ✅     |   ✅    |   —    |
| Attendance    |     ✅      |  ✅   |    —    |     ✅     |   ✅    |   —    |
| Grades        |     ✅      |  ✅   |    —    |     ✅     |   ✅    |   —    |
| Fees          |     ✅      |  ✅   |   ✅    |     —      |   ✅    |   —    |
| Announcements |     ✅      |  ✅   |   ✅    |     ✅     |   ✅    |   ✅   |
| Messages      |     ✅      |  ✅   |   ✅    |     ✅     |   ✅    |   ✅   |
| Reports       |     ✅      |  ✅   |   ✅    |     —      |    —    |   —    |
| Settings      |     ✅      |  ✅   |    —    |     —      |    —    |   —    |

---

## Deployment

### Self-Hosted VPS (Recommended)

```bash
# Build for production
npm run build

# Start production server
npm run start
```

For process management, use [PM2](https://pm2.keymetrics.io/):

```bash
npm install -g pm2
pm2 start npm --name "sms-phsi" -- start
pm2 save
pm2 startup
```

### Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name sms.phsi.edu.ss;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Design System

### Branding

| Token   | Value     | Usage                                     |
| ------- | --------- | ----------------------------------------- |
| Primary | `#1B5E20` | Dark green — headers, buttons, sidebar    |
| Accent  | `#FFD600` | Gold — highlights, badges, call-to-action |

### UI Components

33 shadcn/ui components (New York variant) including: Alert, Avatar, Badge, Button, Calendar, Card, Chart, Checkbox, Command, Dialog, Dropdown Menu, Form, Input, Label, Pagination, Popover, Progress, Radio Group, Scroll Area, Select, Separator, Sheet, Sidebar, Skeleton, Sonner (toast), Switch, Table, Tabs, Textarea, Tooltip, and more.

---

## Seed Data

The seed script (`prisma/seed.ts`) creates:

- **7 Departments** — Nursing, Midwifery, Clinical Medicine, Public Health, Laboratory Science, Pharmacy, Community Health
- **6 Programs** — Diploma in Nursing, Midwifery, Clinical Medicine, Public Health, Lab Technology, Pharmacy Technology
- **~38 Subjects** — Distributed across programs and semesters
- **1 Academic Year** — 2025/2026 with two semesters
- **1 Super Admin** — `admin@phsi.edu.ss` / `PHSI@2025`
- **19 System Settings** — Institution name, grading weights, contact details, etc.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## License

This project is proprietary software developed for the Presbyterian Health Science Institute, Juba, South Sudan.

---

<div align="center">
  <sub>Built with ❤️ for PHSI · Juba, South Sudan</sub>
</div>
