# PHSI School Management System — User Guide
**Presbyterian Health Science Institute, Juba, South Sudan**

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Admin & Registrar Guide](#2-admin--registrar-guide)
   - 2.1 [Managing Students](#21-managing-students)
   - 2.2 [Academic Setup](#22-academic-setup)
   - 2.3 [Classes & Enrollment](#23-classes--enrollment)
   - 2.4 [Subject Offerings](#24-subject-offerings)
   - 2.5 [Grades Management](#25-grades-management)
   - 2.6 [Fees & Payments](#26-fees--payments)
   - 2.7 [Announcements](#27-announcements)
   - 2.8 [Foundation Year & Program Selection](#28-foundation-year--program-selection)
3. [Instructor Guide](#3-instructor-guide)
4. [Student Guide](#4-student-guide)
5. [Grading Scale](#5-grading-scale)
6. [Admission Number Format](#6-admission-number-format)
7. [Frequently Asked Questions](#7-frequently-asked-questions)

---

## 1. Getting Started

### 1.1 How to Log In

1. Open the system in your web browser.
2. Enter your **email address** and **password**.
3. Click **Sign in**.

> **Students:** Your login email and default password were given to you at registration. Your default password is your admission number (e.g., `PHSI/RN/23/001`). **Change your password immediately after your first login.**

> **Staff:** Contact the system administrator if you do not have login credentials.

---

### 1.2 How to Change Your Password

1. Click your **profile picture or name** in the top-right corner.
2. Select **Profile**.
3. Scroll to the **Change Password** section.
4. Enter your current password, then your new password twice.
5. Click **Save**.

---

### 1.3 Forgot Your Password?

1. On the login page, click **Forgot password?**
2. Enter your registered email address.
3. Answer your security question.
4. Enter your new password and confirm it.
5. Click **Reset Password**.

---

### 1.4 Your Dashboard

After logging in, you will see your **Dashboard** — a summary of information relevant to your role:

| Role | What you see |
|---|---|
| Admin / Super Admin | Student count, recent enrollments, fee summaries, announcements |
| Instructor | Your assigned subjects, recent attendance, upcoming exams |
| Student | Your courses, attendance percentage, fee balance, announcements |

---

## 2. Admin & Registrar Guide

> This section is for **Admins**, **Registrars**, and **Super Admins** only.

---

### 2.1 Managing Students

#### Registering a New Student

1. Go to **Students** in the left menu.
2. Click **Add Student** (top right).
3. Fill in the student's details:
   - Full name, email, gender, date of birth
   - **Program** — select the correct program (Foundation Year for new intake)
   - Admission date
4. Click **Register Student**.

The system will automatically generate an **admission number** in the format `PHSI/RN/25/001` and set the student's default password to that same number.

> **Important:** Inform the student of their admission number and default password immediately.

#### Finding a Student

- Go to **Students**.
- Use the **search bar** to search by name or admission number.
- Click on a student's name to view their full profile.

#### Editing a Student's Details

1. Open the student's profile.
2. Click **Edit** (pencil icon).
3. Update the necessary fields.
4. Click **Save**.

#### Importing Multiple Students (Bulk)

1. Go to **Students**.
2. Click **Import Students**.
3. Download the CSV template provided.
4. Fill in student details in the template (one student per row).
5. Upload the completed file.
6. Select the program for the import batch.
7. Click **Import** to process.

---

### 2.2 Academic Setup

#### Programs

The school currently has three programs:

| Program | Code | Description |
|---|---|---|
| Foundation Year | FOUND-Y1 | Common Year 1 for all new students |
| Diploma in Nursing | DIP-NUR | 3-year nursing program |
| Diploma in Midwifery | DIP-MID | 3-year midwifery program |

To view or edit programs: go to **Academics → Programs**.

#### Subjects

To add a new subject:
1. Go to **Academics → Subjects**.
2. Click **Add Subject**.
3. Enter the subject code, name, credit hours, program, and semester number.
4. Click **Save**.

> **Semester numbering:** Year 1 = semesters 1 & 2, Year 2 = semesters 3 & 4, Year 3 = semesters 5 & 6.

#### Academic Calendar

1. Go to **Academics → Calendar**.
2. Click **New Academic Year** to create a new year (e.g., 2026/2027).
3. Add **Semester 1** and **Semester 2** within that year with their start and end dates.
4. Mark the current semester as **Active**.

---

### 2.3 Classes & Enrollment

A **Class** is a group of students (a cohort) studying together in a specific program and year. Think of it as "Foundation Year 2025/2026" or "Nursing Year 2 2025/2026".

#### Creating a New Class

1. Go to **Academics → Classes**.
2. Click **New Class**.
3. Select the **Program**, **Academic Year**, and **Year Level**.
4. Click **Create**.

#### Enrolling Students into a Class

1. Open the class from **Academics → Classes**.
2. Click **Enroll Students**.
3. Search for students by name or admission number.
4. Tick the checkboxes for the students you want to enroll.
5. Click **Enroll Students**.

> Enrolling a student into a class creates their **Semester Enrollment record**. It does **not** automatically add them to any subjects — you must add Subject Offerings next (see Section 2.4).

#### Removing a Student from a Class

1. Open the class.
2. Find the student in the Students table.
3. Click the **trash icon** next to their name.
4. Confirm the removal.

> Removing a student from a class only removes the class membership. Their enrollment and grade records are kept.

#### Promoting Students to the Next Year

At the end of the academic year:
1. Open the current class.
2. Click **Promote Students**.
3. Select the students who have passed.
4. Click **Promote**.

The system will move them to a new Year 2 (or Year 3) class in the next academic year automatically.

---

### 2.4 Subject Offerings

> This is one of the most important features. A subject only appears on a student's transcript and grade sheet if an admin has **explicitly added it as an offering** for the class.

This prevents blank entries on transcripts when a subject is not taught in a given semester.

#### Adding a Subject to a Class for the Current Semester

1. Go to **Academics → Classes** and open the class.
2. Scroll down to the **Subject Offerings** section.
3. Click **Add Subject**.
4. Select the **Semester** (Semester 1 or Semester 2).
5. Select the **Subject** from the dropdown.
6. Click **Add to Offerings**.

The subject is immediately added to the enrollment records of all students in that class. Instructors can now enter grades for it.

> **Rule:** Only add a subject when it is actually going to be taught that semester. If a subject cannot be taught (e.g., no instructor available), simply do not add it.

#### Marking a Subject as Taught (Completed)

Once a subject has been fully taught and all grades are entered:
1. In the Subject Offerings section, find the subject under **Currently Being Taught**.
2. Click **Mark Taught**.
3. Confirm.

The subject moves to **Historical Record** and will not appear in the offerings list again for this class. This prevents the same subject from being accidentally repeated.

#### Removing an Offering (Before Any Grades)

If a subject was added by mistake and **no grades have been entered yet**:
1. Click the trash icon next to the subject.
2. Confirm removal.

> You **cannot** remove an offering once grades have been entered.

---

### 2.5 Grades Management

#### Entering Grades for Students

1. Go to **Grades** in the left menu.
2. Select the **Class**, **Subject**, and **Semester**.
3. You will see a list of enrolled students.
4. Enter each student's score (out of 100).
5. Click **Save Grades**.

The system automatically calculates the grade letter and GPA points.

#### Approving Grades

Grades entered by instructors must be **approved** by an admin before they appear on transcripts.

1. Go to **Grades**.
2. Click the **Pending Approval** tab.
3. Review the grades.
4. Click **Approve** or **Reject**.

#### Grading Scale

| Grade | Marks | GPA Points | Description |
|---|---|---|---|
| A | 80 – 100 | 4.0 | Excellent |
| B | 70 – 79 | 3.0 | Good |
| C | 60 – 69 | 2.0 | Average |
| D | 50 – 59 | 1.0 | Below Average |
| F | Below 50 | 0.0 | Fail |

---

### 2.6 Fees & Payments

#### Setting Up Fee Structures

Fee structures are set **per program, per academic year, per semester**.

1. Go to **Fees → Fee Structures**.
2. Click **New Fee Structure**.
3. Select the program, academic year, semester, and fee category.
4. Enter the amount.
5. Click **Save**.

> Fee structures are automatically assigned to students when they are enrolled in a class.

#### Recording a Payment

1. Go to **Fees**.
2. Search for the student by name or admission number.
3. Click on their outstanding fee.
4. Click **Record Payment**.
5. Enter the amount paid, payment method, and date.
6. Click **Save**.

#### Viewing a Student's Fee Balance

1. Go to **Students** and open the student's profile.
2. Scroll to the **Fees** section to see all fee obligations and balances.

---

### 2.7 Announcements

#### Posting an Announcement

1. Go to **Announcements** in the left menu.
2. Click **New Announcement**.
3. Enter the title and content.
4. Select the **audience** (All, Students only, Staff only).
5. Optionally set an expiry date.
6. Click **Publish**.

Students and staff will see the announcement on their dashboard.

---

### 2.8 Foundation Year & Program Selection

#### How Foundation Year Works

All **new students** are enrolled in the **Foundation Year** program. They study a common curriculum together in Year 1, regardless of whether they will eventually become nurses or midwives.

At the **end of Year 1**, each student submits a **Program Selection request** choosing either Nursing or Midwifery. The admin reviews and approves these requests.

#### How a Student Submits a Program Selection Request

*(The student does this themselves — see Section 4.3)*

#### Reviewing and Approving Program Selection Requests

1. Go to **Program Selection** in the left menu.
2. You will see a list of **pending requests** from Foundation Year students.
3. Click on a request to view the student's details and their chosen program.
4. Click **Approve** to move the student to Year 2 of their chosen program.
   - Or click **Reject** and provide a reason if there is a problem.

> On approval, the system automatically updates the student's program to Nursing or Midwifery and sets their year of study to Year 2.

---

## 3. Instructor Guide

### 3.1 Viewing Your Assigned Subjects

1. Log in and go to your **Dashboard**.
2. Your assigned subjects for the current semester are listed there.
3. Click on a subject to see enrolled students.

### 3.2 Taking Attendance

1. Go to **Attendance** in the left menu.
2. Select your **Subject** and the **Date**.
3. For each student, mark them as **Present**, **Absent**, or **Late**.
4. Click **Save Attendance**.

> Attendance must be taken for each class session. Students can view their own attendance percentage.

### 3.3 Entering Grades

1. Go to **Grades**.
2. Select the subject and semester.
3. Enter each student's total score out of 100.
4. Click **Submit Grades** for admin approval.

> Grades are not visible to students until an admin approves them.

### 3.4 Viewing Your Timetable

Go to **Timetable** to see your class schedule for the week.

### 3.5 Sending Messages

1. Go to **Messages**.
2. Click **Compose**.
3. Select the recipient (another staff member or student).
4. Write your message and click **Send**.

---

## 4. Student Guide

### 4.1 Logging In for the First Time

1. Open the system in your browser.
2. Enter your **email address** — this was given to you at registration. It follows the format: `phsi.rn.23.001@phsi.edu.ss`
3. Enter your **default password** — this is your admission number (e.g., `PHSI/RN/23/001`).
4. Click **Sign in**.
5. **Immediately go to your profile and change your password.**

### 4.2 Viewing Your Courses and Grades

1. Go to **Dashboard** to see a summary of your current courses and grades.
2. Go to **Grades** to see your results for each subject.
3. Go to **Attendance** to see your attendance record.

> Grades only appear after they have been **approved by an admin**.

### 4.3 Submitting a Program Selection Request (Foundation Year Students Only)

When you have completed Year 1, you must choose your program for Year 2.

1. Go to **Program Selection** in the left menu.
2. Click **Choose My Program**.
3. Select either **Diploma in Nursing** or **Diploma in Midwifery**.
4. You may add a short note (optional).
5. Click **Submit**.

Your request will be reviewed by the admin. You will be notified of the outcome. Once approved, your profile will be updated to show your new program and Year 2 status.

### 4.4 Viewing Your Fees

1. Go to **Fees** to see your fee obligations and how much you have paid.
2. If you believe there is an error, contact the registrar.

### 4.5 Viewing Announcements

Announcements from the school are shown on your **Dashboard** and in the **Announcements** section.

### 4.6 Sending a Message

1. Go to **Messages**.
2. Click **Compose**.
3. Select the recipient.
4. Write your message and click **Send**.

---

## 5. Grading Scale

| Grade | Score Range | GPA Points | Meaning |
|---|---|---|---|
| **A** | 80 – 100 | 4.0 | Excellent |
| **B** | 70 – 79 | 3.0 | Good |
| **C** | 60 – 69 | 2.0 | Average |
| **D** | 50 – 59 | 1.0 | Below Average |
| **F** | 0 – 49 | 0.0 | Fail |

The minimum passing grade is **D (50 marks)**.

---

## 6. Admission Number Format

Every student has a unique admission number in this format:

```
PHSI / PROGRAM CODE / YEAR / SEQUENCE
```

**Examples:**
- `PHSI/RN/23/001` — Nursing student, admitted 2023, number 1
- `PHSI/RM/23/180` — Midwifery student, admitted 2023, number 180
- `PHSI/FY/25/001` — Foundation Year student, admitted 2025, number 1

**Program codes:**

| Code | Program |
|---|---|
| RN | Diploma in Nursing |
| RM | Diploma in Midwifery |
| FY | Foundation Year |

---

## 7. Frequently Asked Questions

**Q: A student says they cannot log in. What do I do?**
A: Check that their email address is correct (format: `phsi.rn.23.001@phsi.edu.ss`). Their password is their admission number by default. If still unable to log in, use the **Forgot Password** link on the login page, or reset their password from the student profile in admin.

---

**Q: An instructor says no students appear when they try to enter grades. What is wrong?**
A: The subject has not been added as a **Subject Offering** for the class. Go to **Academics → Classes**, open the relevant class, and click **Add Subject** to add the subject for the current semester. Once added, students will appear in the grades entry screen.

---

**Q: A subject is appearing blank on a student's transcript. What happened?**
A: If a subject was added as an offering but no grade was entered, it will show as blank. Either enter the grade, or — if the subject was never taught — remove the offering (only possible before any grades are entered).

---

**Q: Can a Foundation Year student choose their program before finishing Year 1?**
A: No. The system only allows a student to submit a Program Selection request if they are currently in the Foundation Year program. The admin should only approve requests once the student has satisfactorily completed Year 1.

---

**Q: How do I promote students to Year 2?**
A: Open the current class in **Academics → Classes**, click **Promote Students**, select the qualifying students, and click **Promote**. The system moves them to a new Year 2 class in the next academic year.

---

**Q: A student has paid fees but the system still shows an outstanding balance. What do I do?**
A: Go to **Fees**, find the student, and click **Record Payment** to enter the payment that was missed. Always record payments as they are made to keep balances accurate.

---

**Q: How do I add a new subject to the system?**
A: Go to **Academics → Subjects → Add Subject**. Fill in the subject code (must be unique), name, credit hours, program, and semester number. Once saved, it will appear as an option when adding Subject Offerings to a class.

---

**Q: What is the difference between "Mark Taught" and removing a subject offering?**
A: **Mark Taught** permanently records that a subject was fully taught — it is a historical record and cannot be undone. **Remove** deletes the offering entirely (only allowed if no grades have been entered) — use this only if a subject was added by mistake.

---

*For technical support, contact the system administrator.*

*PHSI School Management System — Presbyterian Health Science Institute, Juba, South Sudan*
