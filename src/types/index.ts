export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  FINANCE = "FINANCE",
  INSTRUCTOR = "INSTRUCTOR",
  STUDENT = "STUDENT",
  PARENT = "PARENT",
}

export enum StudentStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  WITHDRAWN = "WITHDRAWN",
  GRADUATED = "GRADUATED",
  DEFERRED = "DEFERRED",
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export enum EmploymentType {
  FULL_TIME = "FULL_TIME",
  PART_TIME = "PART_TIME",
  CONTRACT = "CONTRACT",
}

export enum AttendanceStatus {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  LATE = "LATE",
  EXCUSED = "EXCUSED",
}

export enum GradeStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  APPROVED = "APPROVED",
  PUBLISHED = "PUBLISHED",
}

export enum EnrollmentStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CONDITIONAL = "CONDITIONAL",
}

export enum PaymentMethod {
  CASH = "CASH",
  BANK_TRANSFER = "BANK_TRANSFER",
  MOBILE_MONEY = "MOBILE_MONEY",
}

export enum FeeCategory {
  TUITION = "TUITION",
  REGISTRATION = "REGISTRATION",
  LAB_FEE = "LAB_FEE",
  LIBRARY_FEE = "LIBRARY_FEE",
  CLINICAL_ATTACHMENT = "CLINICAL_ATTACHMENT",
  EXAMINATION = "EXAMINATION",
  ID_CARD = "ID_CARD",
  OTHER = "OTHER",
}

export enum SubjectType {
  CORE = "CORE",
  ELECTIVE = "ELECTIVE",
}

export enum AdmissionType {
  REGULAR = "REGULAR",
  TRANSFER = "TRANSFER",
  MATURE_ENTRY = "MATURE_ENTRY",
}

export enum ProgramSelectionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  fullName: string;
  avatarUrl?: string | null;
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  roles: Role[];
  children?: NavItem[];
}
