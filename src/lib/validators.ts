import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().email(),
    securityAnswer: z.string().min(1, "Security answer is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name is required"),
  role: z.enum([
    "SUPER_ADMIN",
    "ADMIN",
    "FINANCE",
    "INSTRUCTOR",
    "STUDENT",
    "PARENT",
  ]),
  phone: z.string().optional(),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z
    .enum([
      "SUPER_ADMIN",
      "ADMIN",
      "FINANCE",
      "INSTRUCTOR",
      "STUDENT",
      "PARENT",
    ])
    .optional(),
  isActive: z.boolean().optional(),
});

// Student Validators
export const studentPersonalInfoSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]),
  dob: z.string().min(1, "Date of birth is required"),
  nationality: z.string().default("South Sudanese"),
  nationalId: z.string().optional(),
  address: z.string().optional(),
  stateCounty: z.string().optional(),
});

export const studentGuardianSchema = z.object({
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianEmail: z.string().email().optional().or(z.literal("")),
  guardianRelationship: z.string().optional(),
  guardianAddress: z.string().optional(),
});

export const studentAcademicSchema = z.object({
  programId: z.string().uuid("Please select a program"),
  admissionType: z
    .enum(["REGULAR", "TRANSFER", "MATURE_ENTRY"])
    .default("REGULAR"),
  previousSchool: z.string().optional(),
  previousQualification: z.string().optional(),
  previousGradYear: z.coerce.number().optional(),
});

export const studentMedicalSchema = z.object({
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  disabilities: z.string().optional(),
  medicalNotes: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export const createStudentSchema = studentPersonalInfoSchema
  .merge(studentGuardianSchema)
  .merge(studentAcademicSchema)
  .merge(studentMedicalSchema);

// Staff Validators
export const createStaffSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  dob: z.string().optional(),
  nationality: z.string().default("South Sudanese"),
  nationalId: z.string().optional(),
  address: z.string().optional(),
  designation: z.string().default("Staff"),
  departmentId: z.string().uuid("Please select a department").optional(),
  employmentType: z
    .enum(["FULL_TIME", "PART_TIME", "CONTRACT"])
    .default("FULL_TIME"),
  salary: z.coerce.number().optional(),
  qualifications: z.string().optional(),
  role: z.enum(["ADMIN", "FINANCE", "INSTRUCTOR"]).default("INSTRUCTOR"),
});

// Parent Validators
export const createParentSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// Academic Validators
export const createProgramSchema = z.object({
  name: z.string().min(2, "Program name is required"),
  code: z.string().min(2, "Program code is required"),
  durationSemesters: z.coerce
    .number()
    .min(1, "Duration must be at least 1 semester"),
  totalCredits: z.coerce.number().min(1, "Total credits is required"),
  departmentId: z.string().uuid("Please select a department"),
  description: z.string().optional(),
  entryRequirements: z.string().optional(),
});

export const createSubjectSchema = z.object({
  name: z.string().min(2, "Subject name is required"),
  code: z.string().min(2, "Subject code is required"),
  creditHours: z.coerce.number().min(0.5, "Credit hours must be at least 0.5"),
  programId: z.string().uuid("Please select a program"),
  semesterNumber: z.coerce.number().min(1, "Semester number is required"),
  type: z.enum(["CORE", "ELECTIVE"]).default("CORE"),
  description: z.string().optional(),
});

export const createDepartmentSchema = z.object({
  name: z.string().min(2, "Department name is required"),
  code: z.string().min(2, "Department code is required"),
  headOfDepartmentId: z.string().uuid().optional().nullable(),
});

// Enrollment
export const createEnrollmentSchema = z.object({
  studentId: z.string().uuid(),
  semesterId: z.string().uuid(),
  subjectIds: z.array(z.string().uuid()).min(1, "Select at least one course"),
});

// Timetable
export const createTimetableEntrySchema = z.object({
  subjectId: z.string().uuid("Please select a subject"),
  instructorId: z.string().uuid("Please select an instructor"),
  semesterId: z.string().uuid("Please select a semester"),
  dayOfWeek: z.coerce.number().min(0).max(5),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  room: z.string().min(1, "Room is required"),
});

// Attendance
export const markAttendanceSchema = z.object({
  subjectId: z.string().uuid(),
  date: z.string(),
  records: z.array(
    z.object({
      courseEnrollmentId: z.string().uuid(),
      status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
    }),
  ),
});

// Grades
export const gradeEntrySchema = z.object({
  courseEnrollmentId: z.string().uuid(),
  caMarks: z.coerce.number().min(0).max(100),
  examMarks: z.coerce.number().min(0).max(100),
});

export const bulkGradeEntrySchema = z.object({
  subjectId: z.string().uuid(),
  semesterId: z.string().uuid(),
  grades: z.array(gradeEntrySchema),
});

// Fee Structure
export const createFeeStructureSchema = z.object({
  programId: z.string().uuid("Please select a program"),
  academicYearId: z.string().uuid("Please select an academic year"),
  semesterId: z.string().uuid("Please select a semester"),
  category: z.enum([
    "TUITION",
    "REGISTRATION",
    "LAB_FEE",
    "LIBRARY_FEE",
    "CLINICAL_ATTACHMENT",
    "EXAMINATION",
    "ID_CARD",
    "OTHER",
  ]),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  description: z.string().optional(),
});

// Payment
export const recordPaymentSchema = z.object({
  studentId: z.string().uuid("Please select a student"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "MOBILE_MONEY"]),
  referenceNumber: z.string().optional(),
  paymentDate: z.string().min(1, "Payment date is required"),
  notes: z.string().optional(),
});

// Announcement
export const createAnnouncementSchema = z.object({
  title: z.string().min(2, "Title is required"),
  body: z.string().min(10, "Body must be at least 10 characters"),
  targetAudience: z.string().min(1, "Target audience is required"),
  programId: z.string().uuid().optional().nullable(),
  publishDate: z.string().min(1, "Publish date is required"),
  expiryDate: z.string().optional(),
});

// Message
export const createMessageSchema = z.object({
  recipientId: z.string().uuid("Please select a recipient"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Message body is required"),
});

// Settings
export const institutionSettingsSchema = z.object({
  institutionName: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().optional(),
  motto: z.string().optional(),
  vision: z.string().optional(),
  mission: z.string().optional(),
});

export const academicSettingsSchema = z.object({
  currentAcademicYearId: z.string().uuid().optional(),
  currentSemesterId: z.string().uuid().optional(),
  attendanceThreshold: z.coerce.number().min(0).max(100),
  maxCreditHours: z.coerce.number().min(1),
  caWeight: z.coerce.number().min(0).max(100),
  examWeight: z.coerce.number().min(0).max(100),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
