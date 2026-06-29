# Presbyterian Health Science Institute (PHSI)

## School Management System (SMS)

### Comprehensive System Documentation

---

**Document Version:** 2.0  
**Date:** April 10, 2026  
**Prepared For:** Presbyterian Health Science Institute  
**Location:** Juba, South Sudan  
**System URL:** https://sms-phsi.vercel.app

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [User Roles & Access Control](#3-user-roles--access-control)
4. [Module Descriptions](#4-module-descriptions)
5. [Technical Specifications](#5-technical-specifications)
6. [Security Features](#6-security-features)
7. [Support & Training](#7-support--training)

---

## 1. Executive Summary

The Presbyterian Health Science Institute School Management System (PHSI-SMS) is a comprehensive, web-based platform designed to digitize and streamline all administrative, academic, and financial operations of the institution. This modern system replaces manual, paper-based processes with an integrated digital solution that improves efficiency, accuracy, and accessibility for all stakeholders including administrators, instructors, students, and parents.

### Key Benefits

- **Centralized Data Management:** All institutional data stored securely in one place
- **Real-Time Access:** Stakeholders can access information 24/7 from any device
- **Improved Efficiency:** Automated processes reduce administrative workload
- **Enhanced Communication:** Built-in messaging and announcement systems
- **Accurate Reporting:** Generate instant reports for decision-making
- **Financial Transparency:** Complete fee tracking and payment management
- **Mobile-Friendly:** Responsive design optimized for all screen sizes

---

## 2. System Overview

### 2.1 System Architecture

The PHSI-SMS is built using modern, enterprise-grade technologies:

| Component    | Technology                                       |
| ------------ | ------------------------------------------------ |
| Frontend     | Next.js 16 (Turbopack), React 19, TypeScript     |
| UI Framework | Tailwind CSS, shadcn/ui                          |
| Database     | PostgreSQL (Supabase, Cloud-hosted)              |
| Hosting      | Vercel Edge Network                              |
| Security     | SSL/TLS Encryption, bcrypt password hashing, JWT |

### 2.2 Accessibility

- **Web Access:** https://sms-phsi.vercel.app
- **Supported Browsers:** Chrome, Firefox, Safari, Edge (latest versions)
- **Devices:** Desktop, Laptop, Tablet, Mobile Phone

---

## 3. User Roles & Access Control

The system implements Role-Based Access Control (RBAC) with six distinct user roles:

### 3.1 Super Administrator

**Full system access with complete control over all modules**

- Manage all user accounts and permissions
- Configure system-wide settings (institution profile, academic settings, fee settings)
- Access all reports and analytics
- View complete audit logs
- All Administrator capabilities

### 3.2 Administrator / Registrar

**Manages student records, enrollment, and academic operations**

- Student registration and profile management
- Student import via CSV
- Enrollment and registration approvals
- Academic calendar management (academic years and semesters)
- Program, department, subject, and class management
- Create and manage timetable entries with conflict detection
- Attendance viewing across all subjects
- Grade review and approval
- Generate academic transcripts (PDF with institutional branding)
- Create and manage exam schedules
- Staff registration and management
- Manage announcements
- Access reports (student, staff, academic, financial, attendance)
- Record payments and manage fee structures
- Manage scholarships

### 3.3 Finance Officer

**Handles all financial operations and reporting**

- Configure fee structures by program, academic year, and semester
- Record and track payments (Cash, Bank Transfer, Mobile Money)
- Auto-generate receipt numbers
- Manage scholarships and discounts
- View student financial accounts and balances
- Produce financial reports
- View announcements and send/receive messages
- Access financial reports

### 3.4 Instructor / Lecturer

**Manages classes, attendance, and student assessments**

- View assigned subjects and personal timetable
- View students in programs they teach (grouped by department and year)
- Record student attendance (Present, Absent, Late, Excused)
- Enter and submit grades (CA marks + Exam marks)
- View class performance statistics
- View academic calendar and exam schedules
- Send and receive messages
- View announcements

### 3.5 Student

**Access personal academic and financial information**

- View personal profile and update contact details
- View class timetable
- Check grades and academic results (My Results)
- View fee balance and payment history (My Fees)
- Receive announcements
- Send and receive messages
- Change password and manage security question

### 3.6 Parent / Guardian

**Monitor linked student(s) progress**

- View linked student(s) profiles (name, ID, program, status, enrollment status)
- View linked student(s) fee summaries
- View academic calendar
- Receive announcements
- Send and receive messages

---

## 4. Module Descriptions

### 4.1 Dashboard Module

Each user role has a personalized dashboard displaying relevant information at a glance.

**Administrator Dashboard Features:**

- Total students counter (active, graduated, suspended, withdrawn)
- Staff/lecturer count
- Program and department counts
- Revenue overview (total billed, collected, outstanding)
- Enrollment workflow (pending, approved counts)
- Academic calendar display
- Recent activity feed
- Attendance rate overview
- Latest announcements

**Finance Dashboard Features:**

- Total billed summary
- Total collected
- Pending payments count
- Unpaid students count
- Recent payments table with receipt numbers
- Latest announcements

**Instructor Dashboard Features:**

- Assigned subjects count
- Upcoming classes display
- Personal timetable
- Attendance marked count
- Pending grade submissions
- Latest announcements

**Student Dashboard Features:**

- Enrollment count
- Average score display
- Fee summary (total fees, paid, balance)
- Unpaid fees count
- Personal timetable
- Attendance rates
- Academic calendar
- Latest announcements

**Parent Dashboard Features:**

- Children cards (name, student ID, program, status, enrollment status)
- Fee summary per child
- Academic calendar
- Latest announcements

---

### 4.2 Student Management Module

**Student Registration**
Comprehensive registration form capturing:

- **Personal Information:** First name, middle name, last name, date of birth, gender, nationality, national ID, email, phone, address, state/county
- **Academic Information:** Program selection, admission date, admission type (Regular, Transfer, Mature Entry)
- **Previous Education:** Previous school, qualification, graduation year
- **Guardian/Next-of-Kin:** Name, phone, email, relationship (Father/Mother/Guardian/Sibling/Spouse/Other), address
- **Emergency Contact:** Name and phone
- **Medical Information:** Blood group, allergies, medical conditions, disabilities

**Student Profile Management**

- Complete student records with tabbed interface (Personal, Academic, Financial, Parent Links)
- Status management (Active, Suspended, Withdrawn, Graduated, Deferred)
- Link and unlink parent accounts
- Admin-only edit and delete access (instructors have view-only access)

**Student Directory**

- Searchable and filterable data table
- Auto-generated Student ID (e.g., PHSI-2025-0001)
- Column sorting and pagination
- Instructor view: students grouped by department and year level
- Bulk import via CSV (fullName, email, gender, dateOfBirth, phone)

---

### 4.3 Academic / Program Management Module

**Programs of Study**
Management of academic programs currently offered:

| Program              | Duration              |
| -------------------- | --------------------- |
| Diploma in Nursing   | 3 Years (6 semesters) |
| Diploma in Midwifery | 3 Years (6 semesters) |

_Programs can be added, edited, activated, or deactivated by administrators._

**Subject/Course Unit Management**

- Subject name, code, and credit hours
- Program and semester assignment
- Core/Elective classification
- Instructor assignment (per academic year and semester)
- Prerequisite configuration

**Department Management**

- Department name and code
- Head of Department assignment
- Department staff listing

**Academic Calendar**

- Academic year definitions (name, start/end dates, current year flag)
- Semester definitions per academic year (name, start/end dates, current semester flag)

**Class Management**

- Class cohorts linked to a specific program, academic year, and year level
- Enroll students into classes
- Auto-assignment of matching fee structures when students are enrolled in a class

---

### 4.4 Enrollment & Registration Module

**Semester Registration**

- Students are enrolled for each academic semester
- Admin approval workflow
- Enrollment statuses: Pending, Approved, Rejected, Conditionally Approved
- Linked to specific class sections

**Course Enrollment**

- Students are enrolled in specific subjects per enrollment
- Enrollment prerequisites enforced

---

### 4.5 Timetable / Class Scheduling Module

**Class Schedule Management**

- Create timetable entries (subject, instructor, semester, day, start time, end time, room)
- Days: Monday through Saturday
- Automatic conflict detection (instructor and room double-booking prevention)

**Timetable Views**

- Weekly grid view and list view
- Filter by semester
- Admin: filter by class
- Instructor: personal schedule
- Student: personal timetable (auto-generated based on enrolled subjects)

---

### 4.6 Attendance Management Module

**Attendance Taking**

- Select subject and date
- Mark students: Present, Absent, Late, Excused
- Records who marked the attendance

**Attendance Tracking**

- View history by student, subject, or date
- Automatic attendance percentage calculation
- Default threshold: 75%
- Accessible by administrators and instructors

**Attendance Reports**

- Summary by subject and program
- Low attendance flags
- Exportable via reports module

---

### 4.7 Grading & Examination Module

**Grade Entry**

- Continuous Assessment (CA) marks entry (weight: 40%)
- Examination marks entry (weight: 60%)
- Automatic total marks calculation
- Automatic grade letter and GPA points assignment

**Grading Scale**

| Grade | Percentage | GPA Points | Description   |
| ----- | ---------- | ---------- | ------------- |
| A     | 70–100     | 4.0        | Excellent     |
| B+    | 65–69      | 3.5        | Very Good     |
| B     | 60–64      | 3.0        | Good          |
| C+    | 55–59      | 2.5        | Fairly Good   |
| C     | 50–54      | 2.0        | Average       |
| D     | 45–49      | 1.5        | Below Average |
| F     | Below 45   | 0.0        | Fail          |

**Grade Approval Workflow**

1. Instructor enters grades → status: **Draft**
2. Instructor submits grades → status: **Submitted**
3. Administrator reviews and approves → status: **Approved**
4. Students can view approved grades in "My Results"

**Academic Transcripts**

- Admin-only transcript generation
- All semesters with courses, grades, credits, CA marks, exam marks, total marks
- GPA per semester and cumulative GPA (CGPA)
- Institutional header with PHSI logo (left) and PRDA logo (right)
- Downloadable PDF with watermark, verification hash, and document reference
- Grading scale included on transcript

**Examination Schedule Management**

- Create exam schedules per subject, semester, and class
- Assign date, time, venue, and duration
- Published exam schedule viewable by students and instructors

---

### 4.8 Fee & Finance Management Module

**Fee Structure Configuration**

- Define fees per program, academic year, and semester
- Fee categories:
  - Tuition Fee
  - Registration Fee
  - Laboratory Fee
  - Library Fee
  - Clinical Attachment Fee
  - Examination Fee
  - ID Card Fee
  - Other Fees
- Supported currencies: SSP and USD
- Auto-assignment: When students are enrolled in a class, matching fee structures are automatically assigned (with scholarship discounts applied)

**Student Financial Accounts**

- Individual student fee ledgers
- Total fees charged
- Payments made
- Outstanding balance
- Per-fee-structure breakdown

**Payment Recording**

- Record payments with:
  - Amount and currency (SSP or USD)
  - Payment method (Cash, Bank Transfer, Mobile Money)
  - Reference/Receipt number
  - Payment date
  - Recorded by (staff member)
- Auto-generated receipt numbers

**Scholarships & Discounts**

- Scholarship type and sponsor
- Amount or percentage discount
- Start and end date validity
- Linked to individual students
- Auto-deduction when fee structures are assigned

**Financial Reports**

- Revenue collection summary
- Revenue by program
- Outstanding fees report
- Payment history
- Export via reports module

---

### 4.9 Staff / Human Resource Module

**Staff Registration**

- Personal information (full name, gender, DOB, nationality, national ID, phone, email, address)
- Employment details (auto-generated Staff ID, designation, department, employment type: Full-Time / Part-Time / Contract)
- Date of hire and salary information
- Qualifications
- Option to convert existing system users to staff records

**Staff Directory**

- Searchable staff list
- Filter and sort capabilities
- Admin-only access

**Department Management**

- Create and manage departments
- Assign Head of Department
- View department staff

---

### 4.10 Communication & Announcements Module

**Announcements**

- Create announcements with:
  - Title and body text
  - Target audience (All Users, Students, Instructors, Staff, Parents)
  - Optional program-specific targeting
  - Publish date and expiry date
  - Attachments support
- Read tracking per user (who has read which announcement)
- Displayed on all user dashboards
- Accessible by all roles

**Internal Messaging**

- Send messages to any system user
- Subject and body fields
- Inbox and Sent views
- Read/unread status tracking
- Unread count badge in sidebar
- Search functionality (search messages by content)
- Broadcast messaging (admin can send to multiple recipients)
- Available to all roles including parents

---

### 4.11 Reports & Analytics Module

**Pre-Built Reports**

| Report Category    | Reports Available                                        |
| ------------------ | -------------------------------------------------------- |
| Student Reports    | Enrollment statistics, demographics, status distribution |
| Academic Reports   | Performance analysis, pass rates, grade distribution     |
| Financial Reports  | Revenue collection, outstanding fees, payment trends     |
| Attendance Reports | Attendance trends, rates, low-attendance flags           |
| Staff Reports      | Staff directory, department distribution, roles          |
| Summary Dashboard  | High-level institutional KPIs and charts                 |

**Report Features**

- Visual charts (bar, line, pie/donut)
- Data tables with sorting and search
- Export to CSV via API (`/api/reports/export`)
- Accessible by Super Admin, Admin, and Finance roles

---

### 4.12 Settings & Configuration Module

**Institution Profile** _(Super Admin only)_

- School name, address, contact information
- Logo and branding

**Academic Settings**

- Grading scale configuration
- Attendance threshold percentage
- Maximum credit hours per semester
- CA/Exam weight configuration

**Fee Settings**

- Currency configuration (SSP/USD)
- Payment method settings

**User Management**

- Create, edit, and deactivate user accounts
- Role assignment (Super Admin, Admin, Finance, Instructor, Student, Parent)
- Account activation/deactivation
- Default security question assigned on account creation

**Audit Log**

- Complete audit trail of all user actions
- Logged: User, action type, entity type, entity ID, details, IP address, timestamp
- Searchable and filterable
- Exportable

---

### 4.13 Profile & Account Module

All users can manage their own profile:

- View and update personal details (full name, phone)
- View role and account information (email, role, creation date)
- Role-specific details: Students see student ID, program, year; Staff see staff ID, designation, department
- **Change Password:** Update login password
- **Security Question:** Set or update a personal security question and answer for self-service password recovery

---

### 4.14 Authentication Module

**Login**

- Secure email and password login
- Account lockout after failed attempts

**Self-Service Password Reset**

- Step 1: Enter email address
- Step 2: Answer security question
- Step 3: Set new password
- All accounts are created with a default security question ("What is the name of this institution?")
- Users can customize their security question from their profile

---

## 5. Technical Specifications

### 5.1 Performance

- **Page Load Time:** < 3 seconds on standard connection
- **Rendering:** Server-side rendering with Turbopack for fast builds
- **Rate Limiting:** Built-in rate limiting on sensitive actions (login, password reset)

### 5.2 Data Storage

- **Database:** PostgreSQL (Supabase cloud-hosted)
- **ORM:** Prisma 6.19
- **Schema:** 30+ data models covering all institutional operations

### 5.3 API Endpoints

- `/api/attendance/students` — Attendance data query
- `/api/messages/unread-count` — Unread message count
- `/api/reports/export` — CSV export (students, staff, academic, financial, attendance)
- `/api/programs` — Program listing
- `/api/instructors` — Instructor lookup
- `/api/transcripts/[studentId]` — PDF transcript generation
- `/api/users-without-staff` — Users available for staff conversion

---

## 6. Security Features

### 6.1 Authentication & Authorization

- Secure login with email/password
- Password hashing (bcrypt algorithm, 12 salt rounds)
- JWT-based sessions (HS256) with HTTP-only secure cookies
- Role-based access control (RBAC) enforced at middleware, page, and action levels
- Session refresh mechanism
- Account lockout after repeated failed login attempts
- Self-service password reset via security questions

### 6.2 Data Protection

- SSL/TLS encryption for all data in transit
- SQL injection prevention (Prisma parameterized queries)
- Input validation and sanitization (Zod schema validation)
- XSS attack prevention
- Rate limiting on sensitive endpoints

### 6.3 Audit & Compliance

- Complete audit trail logging for all data modifications
- User action tracking (who, what, when, IP address)
- Audit log search and export capabilities

---

## 7. Support & Training

### 7.1 Training Provided

| Training Session           | Duration | Audience           |
| -------------------------- | -------- | ------------------ |
| System Overview            | 2 hours  | All Users          |
| Administrator Training     | 4 hours  | Admin Staff        |
| Finance Module Training    | 3 hours  | Finance Team       |
| Instructor Training        | 2 hours  | Lecturers          |
| Student/Parent Orientation | 1 hour   | Students & Parents |

### 7.2 Support Services

**During Implementation (First 3 Months)**

- Dedicated support contact
- Response time: Within 4 business hours
- On-site support visits as needed
- Bug fixes and adjustments included

**Annual Maintenance (After Year 1)**

- Technical support via email and phone
- System updates and security patches
- Performance monitoring
- Bug fixes
- Minor feature enhancements
- Annual system health check

### 7.3 Documentation

- User manuals for each role
- Video tutorials
- FAQ documentation
- Quick reference guides

---

## Contact Information

**Developer:** Allela Ventures Ltd  
**Email:** info@allelaventures.com  
**Phone:** +211 927 654 174  
**Website:** https://allelaventures.com

---

_This document is confidential and intended for Presbyterian Health Science Institute (PHSI) internal use only._

---
