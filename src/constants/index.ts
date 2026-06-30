import { Role, type NavItem } from "@/types";

export const APP_NAME = "PHSI - School Management System";
export const INSTITUTION_NAME = "Presbyterian Health Science Institute";
export const INSTITUTION_SHORT = "PHSI";
export const INSTITUTION_ADDRESS = "Juba, South Sudan";
export const INSTITUTION_MOTTO =
  "Training Health Professionals for a Healthier South Sudan";

export const DEFAULT_GRADING_SCALE = [
  {
    letter: "A",
    minScore: 80,
    maxScore: 100,
    gpaPoints: 4.0,
    description: "Excellent",
  },
  {
    letter: "B",
    minScore: 70,
    maxScore: 79,
    gpaPoints: 3.0,
    description: "Good",
  },
  {
    letter: "C",
    minScore: 60,
    maxScore: 69,
    gpaPoints: 2.0,
    description: "Average",
  },
  {
    letter: "D",
    minScore: 50,
    maxScore: 59,
    gpaPoints: 1.0,
    description: "Below Average",
  },
  {
    letter: "F",
    minScore: 0,
    maxScore: 49,
    gpaPoints: 0.0,
    description: "Fail",
  },
];

export const DEFAULT_ATTENDANCE_THRESHOLD = 75;
export const DEFAULT_MAX_CREDIT_HOURS = 24;
export const DEFAULT_CA_WEIGHT = 40;
export const DEFAULT_EXAM_WEIGHT = 60;

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
    roles: [
      Role.SUPER_ADMIN,
      Role.ADMIN,
      Role.FINANCE,
      Role.INSTRUCTOR,
      Role.STUDENT,
      Role.PARENT,
    ],
  },
  {
    title: "Students",
    href: "/students",
    icon: "GraduationCap",
    roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR],
    children: [
      {
        title: "All Students",
        href: "/students",
        icon: "Users",
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR],
      },
      {
        title: "Add Student",
        href: "/students/new",
        icon: "UserPlus",
        roles: [Role.SUPER_ADMIN, Role.ADMIN],
      },
      {
        title: "Import Students",
        href: "/students/import",
        icon: "Upload",
        roles: [Role.SUPER_ADMIN, Role.ADMIN],
      },
    ],
  },
  {
    title: "Staff",
    href: "/staff",
    icon: "Briefcase",
    roles: [Role.SUPER_ADMIN, Role.ADMIN],
    children: [
      {
        title: "All Staff",
        href: "/staff",
        icon: "Users",
        roles: [Role.SUPER_ADMIN, Role.ADMIN],
      },
      {
        title: "Add Staff",
        href: "/staff/new",
        icon: "UserPlus",
        roles: [Role.SUPER_ADMIN, Role.ADMIN],
      },
    ],
  },
  {
    title: "Parents",
    href: "/parents",
    icon: "Users",
    roles: [Role.SUPER_ADMIN, Role.ADMIN],
    children: [
      {
        title: "All Parents",
        href: "/parents",
        icon: "Users",
        roles: [Role.SUPER_ADMIN, Role.ADMIN],
      },
      {
        title: "Add Parent",
        href: "/parents/new",
        icon: "UserPlus",
        roles: [Role.SUPER_ADMIN, Role.ADMIN],
      },
    ],
  },
  {
    title: "Academics",
    href: "/academics",
    icon: "BookOpen",
    roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR],
    children: [
      {
        title: "Programs",
        href: "/academics/programs",
        icon: "Library",
        roles: [Role.SUPER_ADMIN, Role.ADMIN],
      },
      {
        title: "Subjects",
        href: "/academics/subjects",
        icon: "BookText",
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR],
      },
      {
        title: "Departments",
        href: "/academics/departments",
        icon: "Building2",
        roles: [Role.SUPER_ADMIN, Role.ADMIN],
      },
      {
        title: "Classes",
        href: "/academics/classes",
        icon: "Users",
        roles: [Role.SUPER_ADMIN, Role.ADMIN],
      },
      {
        title: "Academic Calendar",
        href: "/academics/calendar",
        icon: "CalendarDays",
        roles: [Role.SUPER_ADMIN, Role.ADMIN],
      },
    ],
  },
  // {
  //   title: "Enrollment",
  //   href: "/enrollment",
  //   icon: "ClipboardList",
  //   roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.STUDENT],
  // },
  {
    title: "Program Selection",
    href: "/program-selection",
    icon: "GitBranch",
    roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.STUDENT],
  },
  {
    title: "Timetable",
    href: "/timetable",
    icon: "Clock",
    roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR, Role.STUDENT],
  },
  {
    title: "Attendance",
    href: "/attendance",
    icon: "ClipboardCheck",
    roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR],
  },
  {
    title: "Grades & Exams",
    href: "/grades",
    icon: "FileCheck",
    roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR, Role.STUDENT],
    children: [
      {
        title: "Grade Entry",
        href: "/grades/enter",
        icon: "PenLine",
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR],
      },
      {
        title: "Grade Review",
        href: "/grades/review",
        icon: "CheckCircle",
        roles: [Role.SUPER_ADMIN, Role.ADMIN],
      },
      {
        title: "My Results",
        href: "/grades/my-results",
        icon: "Award",
        roles: [Role.STUDENT],
      },
      {
        title: "Transcripts",
        href: "/grades/transcripts",
        icon: "FileText",
        roles: [Role.SUPER_ADMIN, Role.ADMIN],
      },
      {
        title: "Exam Schedule",
        href: "/grades/exams",
        icon: "Calendar",
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR, Role.STUDENT],
      },
    ],
  },
  {
    title: "Fees & Finance",
    href: "/fees",
    icon: "Wallet",
    roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE, Role.STUDENT],
    children: [
      {
        title: "Fee Structures",
        href: "/fees/structures",
        icon: "Settings2",
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE],
      },
      {
        title: "Student Accounts",
        href: "/fees/accounts",
        icon: "CreditCard",
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE],
      },
      {
        title: "Record Payment",
        href: "/fees/payments/new",
        icon: "PlusCircle",
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE],
      },
      {
        title: "Payment History",
        href: "/fees/payments",
        icon: "Receipt",
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE],
      },
      {
        title: "Scholarships",
        href: "/fees/scholarships",
        icon: "Award",
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE],
      },
      {
        title: "My Fees",
        href: "/fees/my-fees",
        icon: "Wallet",
        roles: [Role.STUDENT],
      },
      {
        title: "Fee Reports",
        href: "/fees/reports",
        icon: "BarChart2",
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE],
      },
    ],
  },
  {
    title: "Announcements",
    href: "/announcements",
    icon: "Megaphone",
    roles: [
      Role.SUPER_ADMIN,
      Role.ADMIN,
      Role.FINANCE,
      Role.INSTRUCTOR,
      Role.STUDENT,
      Role.PARENT,
    ],
  },
  {
    title: "Messages",
    href: "/messages",
    icon: "MessageSquare",
    roles: [
      Role.SUPER_ADMIN,
      Role.ADMIN,
      Role.FINANCE,
      Role.INSTRUCTOR,
      Role.STUDENT,
      Role.PARENT,
    ],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: "BarChart3",
    roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: "Settings",
    roles: [Role.SUPER_ADMIN, Role.ADMIN],
    children: [
      {
        title: "Institution",
        href: "/settings/institution",
        icon: "School",
        roles: [Role.SUPER_ADMIN],
      },
      {
        title: "Academic",
        href: "/settings/academic",
        icon: "GraduationCap",
        roles: [Role.SUPER_ADMIN, Role.ADMIN],
      },
      {
        title: "Fee Settings",
        href: "/settings/fees",
        icon: "DollarSign",
        roles: [Role.SUPER_ADMIN, Role.ADMIN],
      },
      {
        title: "Users",
        href: "/settings/users",
        icon: "UsersRound",
        roles: [Role.SUPER_ADMIN],
      },
      {
        title: "Audit Log",
        href: "/settings/audit-log",
        icon: "ScrollText",
        roles: [Role.SUPER_ADMIN],
      },
    ],
  },
];

export const ROLE_LABELS: Record<Role, string> = {
  [Role.SUPER_ADMIN]: "Super Admin",
  [Role.ADMIN]: "Admin / Registrar",
  [Role.FINANCE]: "Finance Officer",
  [Role.INSTRUCTOR]: "Instructor / Lecturer",
  [Role.STUDENT]: "Student",
  [Role.PARENT]: "Parent / Guardian",
};

export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  WITHDRAWN: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  GRADUATED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  DEFERRED:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  CONDITIONAL:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  SUBMITTED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  PUBLISHED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  PRESENT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  ABSENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  LATE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  EXCUSED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
};
