# Presbyterian Health Science Institute (PHSI)

## School Management System (SMS)

### Comprehensive System Documentation

---

**Document Version:** 1.0  
**Date:** March 24, 2026  
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
- **Improved Efficiency:** Automated processes reduce administrative workload by up to 70%
- **Enhanced Communication:** Built-in messaging and announcement systems
- **Accurate Reporting:** Generate instant reports for decision-making
- **Financial Transparency:** Complete fee tracking and payment management
- **Mobile-Friendly:** Optimized for low-bandwidth environments common in South Sudan

---

## 2. System Overview

### 2.1 System Architecture

The PHSI-SMS is built using modern, enterprise-grade technologies:

| Component    | Technology                                  |
| ------------ | ------------------------------------------- |
| Frontend     | Next.js 16, React 19, TypeScript            |
| UI Framework | Tailwind CSS, shadcn/ui                     |
| Database     | PostgreSQL (Cloud-hosted)                   |
| Hosting      | Vercel Edge Network                         |
| Security     | SSL/TLS Encryption, bcrypt password hashing |

### 2.2 Accessibility

- **Web Access:** https://sms-phsi.vercel.app
- **Supported Browsers:** Chrome, Firefox, Safari, Edge (latest versions)
- **Devices:** Desktop, Laptop, Tablet, Mobile Phone
- **Internet:** Optimized for low-bandwidth connections

---

## 3. User Roles & Access Control

The system implements Role-Based Access Control (RBAC) with six distinct user roles:

### 3.1 Super Administrator

**Full system access with complete control over all modules**

- Manage all user accounts and permissions
- Configure system-wide settings
- Access all reports and analytics
- Manage institution profile and branding
- Perform data backups and exports
- View complete audit logs

### 3.2 Administrator / Registrar

**Manages student records, enrollment, and academic operations**

- Student registration and profile management
- Enrollment and registration approvals
- Academic calendar management
- Program and course management
- Generate academic reports
- Manage announcements

### 3.3 Finance Officer

**Handles all financial operations and reporting**

- Configure fee structures
- Record and track payments
- Generate payment receipts
- Manage scholarships and discounts
- Produce financial reports
- Monitor outstanding balances
- Daily/weekly/monthly collection reports

### 3.4 Instructor / Lecturer

**Manages classes, attendance, and student assessments**

- View assigned courses and timetables
- Record student attendance
- Enter and submit grades
- Upload course materials
- Communicate with students
- View class performance statistics

### 3.5 Student

**Access personal academic and financial information**

- View personal profile and enrollment status
- Access class timetable
- Check grades and academic transcript
- View fee balance and payment history
- Receive announcements and messages
- Register for courses (when enabled)

### 3.6 Parent / Guardian

**Monitor linked student(s) progress**

- View linked student(s) profiles
- Monitor attendance records
- Check academic performance and grades
- View fee balance and payments
- Receive important announcements

---

## 4. Module Descriptions

### 4.1 Dashboard Module

Each user role has a personalized dashboard displaying relevant information at a glance.

**Administrator Dashboard Features:**

- Total students counter (active, graduated, suspended, withdrawn)
- Staff/lecturer count
- Revenue overview (collected vs. outstanding)
- Enrollment trends chart
- Recent activity feed
- Quick action buttons

**Finance Dashboard Features:**

- Revenue collection summary (pie/donut chart)
- Outstanding fees alerts
- Recent payments table
- Revenue by program breakdown
- Payment trends analysis

**Instructor Dashboard Features:**

- Today's class schedule
- Assigned courses list
- Attendance summary per course
- Pending grade submissions
- Quick links to take attendance and enter grades

**Student Dashboard Features:**

- Enrollment status card
- Current semester courses
- Personal timetable
- GPA/CGPA display
- Fee balance summary
- Latest announcements

---

### 4.2 Student Management Module

**Student Registration**
Comprehensive multi-step registration form capturing:

- **Personal Information:** Full name, date of birth, gender, nationality, national ID/passport, photo, contact details, physical address, state/county
- **Guardian/Next-of-Kin:** Name, relationship, phone, email, address
- **Academic Background:** Previous education, qualifications, admission type
- **Medical Information:** Blood type, allergies, disabilities, emergency contact
- **Document Uploads:** National ID, transcripts, medical certificate, photos

**Student Profile Management**

- Complete student records with tabbed interface
- Personal, Academic, Financial, Medical, and Documents tabs
- Status management (Active, Suspended, Withdrawn, Graduated, Deferred)
- Status change history with reasons logged

**Student Directory**

- Searchable and filterable data table
- Auto-generated Student ID (e.g., PHSI-2025-0001)
- Column sorting and pagination
- Export to CSV and PDF
- Bulk import via CSV template

---

### 4.3 Academic / Program Management Module

**Programs of Study**
Complete management of academic programs offered:

| Program                              | Duration |
| ------------------------------------ | -------- |
| Diploma in Nursing                   | 3 Years  |
| Certificate in Midwifery             | 2 Years  |
| Diploma in Clinical Medicine         | 3 Years  |
| Diploma in Public Health             | 3 Years  |
| Certificate in Pharmacy              | 2 Years  |
| Certificate in Laboratory Technology | 2 Years  |

**Subject/Course Unit Management**

- Subject name, code, and credit hours
- Program and semester assignment
- Core/Elective classification
- Instructor assignment
- Prerequisite configuration

**Academic Calendar**

- Academic year and semester definitions
- Key dates management (registration, exams, holidays, graduation)
- Visual calendar display
- Current active semester indicator

**Curriculum Mapping**

- Subject-to-semester mapping per program
- Prerequisite chain configuration
- Credit hour totals per semester

---

### 4.4 Enrollment & Registration Module

**Semester Registration**

- Students register for each academic term
- Admin approval workflow
- Registration statuses: Pending, Approved, Rejected, Conditionally Approved
- Fee payment verification option

**Course Enrollment**

- Students enroll in specific subjects
- Prerequisite enforcement
- Credit hour limit validation
- Enrollment confirmation

**Enrollment Reports**

- Enrollment by program, semester, gender, year
- Visual charts and data tables
- Exportable reports

---

### 4.5 Timetable / Class Scheduling Module

**Class Schedule Management**

- Create timetable entries (subject, instructor, day, time, room)
- Automatic conflict detection
- Instructor and room double-booking prevention

**Timetable Views**

- By Program/Class (weekly grid view)
- By Instructor (personal schedule)
- By Room/Venue
- Student personal timetable (auto-generated)

---

### 4.6 Attendance Management Module

**Attendance Taking**

- Select course and date
- Mark students: Present, Absent, Late, Excused
- Bulk marking option (mark all present, then adjust)
- Submit and lock attendance records

**Attendance Tracking**

- View history by student, course, or date range
- Automatic percentage calculation
- Threshold alerts (e.g., below 75%)
- Student and admin notifications

**Attendance Reports**

- Summary by course and program
- Individual student attendance records
- Export to PDF and CSV

---

### 4.7 Grading & Examination Module

**Grade Entry**

- Continuous Assessment (CA) marks entry
- Examination marks entry
- Configurable weighting (default: CA 40%, Exam 60%)
- Automatic total and grade letter calculation

**Grading Scale**
| Grade | Percentage | Grade Points |
|-------|------------|--------------|
| A | 70-100 | 5.0 |
| B+ | 65-69 | 4.5 |
| B | 60-64 | 4.0 |
| C+ | 55-59 | 3.5 |
| C | 50-54 | 3.0 |
| D | 45-49 | 2.0 |
| F | Below 45 | 0.0 |

**Grade Approval Workflow**

1. Instructor enters and submits grades (Draft → Submitted)
2. Head of Department reviews (Submitted → Approved)
3. Registrar publishes (Approved → Published)
4. Students can view published grades

**Academic Transcripts**

- Auto-generated official transcripts
- All semesters with courses, grades, and credits
- GPA per semester and CGPA
- School letterhead and branding
- Downloadable PDF format

**Examination Management**

- Exam timetable creation
- Venue and duration assignment
- Published exam schedule for students

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

**Student Financial Accounts**

- Individual student ledgers
- Total fees charged
- Payments made
- Outstanding balance
- Overpayments/Credits

**Payment Recording**

- Record payments with:
  - Amount and currency (SSP or USD)
  - Payment method (Cash, Bank Transfer, Mobile Money)
  - Reference/Receipt number
  - Payment date
  - Recorded by (staff member)
- Auto-generate printable receipts

**Scholarships & Discounts**

- Scholarship type and sponsor
- Amount or percentage discount
- Validity period
- Auto-deduction from fees

**Financial Reports**

- Total revenue collected by period
- Revenue by program and fee category
- Outstanding fees report (students with balances)
- Payment history report
- Daily/weekly/monthly collection summaries
- Export to PDF and CSV

**Fee Enforcement**

- Configurable registration block for unpaid fees
- Outstanding balance alerts
- Fee reminder system

---

### 4.9 Staff / Human Resource Module

**Staff Registration**

- Personal information (name, gender, DOB, nationality, ID, contact)
- Employment details (Staff ID, designation, department, employment type)
- Date of hire and salary information
- Qualifications and certifications
- Document uploads (CV, certificates, contract)

**Staff Directory**

- Searchable staff list
- Filter by department, role, status
- Contact information access
- Quick profile view

**Department Management**

- Create and manage departments
- Assign Head of Department
- Department staff listing

---

### 4.10 Communication & Announcements Module

**Announcements**

- Create announcements with:
  - Title and rich text body
  - Target audience (All, specific programs, specific years, staff only)
  - Attachments
  - Publish and expiry dates
- Displayed on user dashboards

**Internal Messaging**

- Admin to students messaging
- Instructor to class messaging
- Inbox and sent messages
- Read/unread status

**Notification System**

- In-app notifications
- Email notifications (configurable)
- SMS integration ready (future enhancement)

---

### 4.11 Reports & Analytics Module

**Pre-Built Reports**

| Report Category    | Reports Available                                         |
| ------------------ | --------------------------------------------------------- |
| Student Reports    | Enrollment statistics, Student directory, Status summary  |
| Academic Reports   | Performance analysis, Pass/fail rates, Grade distribution |
| Financial Reports  | Revenue summary, Outstanding fees, Collection reports     |
| Attendance Reports | Attendance summary, Low attendance alerts                 |
| Staff Reports      | Staff directory, Department summary                       |

**Report Features**

- Filter by academic year, semester, program, department, date range
- Visual charts (bar, line, pie/donut)
- Data tables with sorting and search
- Export to PDF and CSV

---

### 4.12 Settings & Configuration Module

**Institution Profile**

- School name, address, contact information
- Logo and branding
- Mission, vision, and motto

**Academic Settings**

- Current academic year and semester
- Grading scale configuration
- Attendance threshold percentage
- Maximum credit hours per semester

**Fee Settings**

- Currency configuration (SSP/USD)
- Payment deadline settings
- Registration block toggle

**User Management**

- Create, edit, and delete user accounts
- Role assignment
- Account activation/deactivation
- Password reset

**System Settings**

- Backup and data export
- Audit log viewing

---

## 5. Technical Specifications

### 5.1 Performance

- **Page Load Time:** < 3 seconds on standard connection
- **Optimized:** Low-bandwidth environments
- **Concurrent Users:** Supports 500+ simultaneous users
- **Uptime:** 99.9% availability guarantee

### 5.2 Data Storage

- **Database:** PostgreSQL (cloud-hosted)
- **File Storage:** Secure cloud storage for documents
- **Backup:** Daily automated backups
- **Retention:** 7-year data retention capability

### 5.3 Integrations Ready

- SMS Gateway (Africa's Talking compatible)
- Email Service (SMTP)
- Mobile Money APIs (M-Pesa, MTN Mobile Money)
- Export formats (PDF, CSV, Excel)

---

## 6. Security Features

### 6.1 Authentication & Authorization

- Secure login with email/password
- Password hashing (bcrypt algorithm)
- HTTP-only secure session cookies
- Role-based access control (RBAC)
- Session timeout and auto-logout

### 6.2 Data Protection

- SSL/TLS encryption for all data in transit
- Encrypted data at rest
- SQL injection prevention
- Input validation and sanitization
- XSS attack prevention

### 6.3 Audit & Compliance

- Complete audit trail logging
- User action tracking (who, what, when)
- IP address logging
- Data export for compliance reporting

### 6.4 Backup & Recovery

- Daily automated backups
- Point-in-time recovery capability
- Disaster recovery procedures
- Data export functionality

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
