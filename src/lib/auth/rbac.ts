import { Role } from "@/types";

// Route-level permissions: which roles can access which routes
export const ROUTE_PERMISSIONS: Record<string, Role[]> = {
  "/dashboard": [
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.FINANCE,
    Role.INSTRUCTOR,
    Role.STUDENT,
    Role.PARENT,
  ],
  "/students": [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR, Role.PARENT],
  "/staff": [Role.SUPER_ADMIN, Role.ADMIN],
  "/parents": [Role.SUPER_ADMIN, Role.ADMIN],
  "/academics": [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR],
  "/enrollment": [Role.SUPER_ADMIN, Role.ADMIN, Role.STUDENT],
  "/timetable": [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR, Role.STUDENT],
  "/attendance": [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR],
  "/grades": [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR, Role.STUDENT],
  "/fees": [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE, Role.STUDENT],
  "/announcements": [
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.FINANCE,
    Role.INSTRUCTOR,
    Role.STUDENT,
    Role.PARENT,
  ],
  "/messages": [
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.FINANCE,
    Role.INSTRUCTOR,
    Role.STUDENT,
    Role.PARENT,
  ],
  "/reports": [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE],
  "/settings": [Role.SUPER_ADMIN, Role.ADMIN],
};

// Action-level permissions
type Action = "create" | "read" | "update" | "delete";

const MODULE_PERMISSIONS: Record<string, Record<Action, Role[]>> = {
  students: {
    create: [Role.SUPER_ADMIN, Role.ADMIN],
    read: [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR],
    update: [Role.SUPER_ADMIN, Role.ADMIN],
    delete: [Role.SUPER_ADMIN],
  },
  staff: {
    create: [Role.SUPER_ADMIN, Role.ADMIN],
    read: [Role.SUPER_ADMIN, Role.ADMIN],
    update: [Role.SUPER_ADMIN, Role.ADMIN],
    delete: [Role.SUPER_ADMIN],
  },
  programs: {
    create: [Role.SUPER_ADMIN, Role.ADMIN],
    read: [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR, Role.STUDENT],
    update: [Role.SUPER_ADMIN, Role.ADMIN],
    delete: [Role.SUPER_ADMIN],
  },
  subjects: {
    create: [Role.SUPER_ADMIN, Role.ADMIN],
    read: [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR, Role.STUDENT],
    update: [Role.SUPER_ADMIN, Role.ADMIN],
    delete: [Role.SUPER_ADMIN],
  },
  enrollment: {
    create: [Role.SUPER_ADMIN, Role.ADMIN, Role.STUDENT],
    read: [Role.SUPER_ADMIN, Role.ADMIN, Role.STUDENT],
    update: [Role.SUPER_ADMIN, Role.ADMIN],
    delete: [Role.SUPER_ADMIN],
  },
  attendance: {
    create: [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR],
    read: [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR, Role.STUDENT],
    update: [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR],
    delete: [Role.SUPER_ADMIN],
  },
  grades: {
    create: [Role.SUPER_ADMIN, Role.INSTRUCTOR],
    read: [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR, Role.STUDENT],
    update: [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR],
    delete: [Role.SUPER_ADMIN],
  },
  fees: {
    create: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE],
    read: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE, Role.STUDENT],
    update: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE],
    delete: [Role.SUPER_ADMIN],
  },
  timetable: {
    create: [Role.SUPER_ADMIN, Role.ADMIN],
    read: [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR, Role.STUDENT],
    update: [Role.SUPER_ADMIN, Role.ADMIN],
    delete: [Role.SUPER_ADMIN, Role.ADMIN],
  },
  payments: {
    create: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE],
    read: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE, Role.STUDENT],
    update: [Role.SUPER_ADMIN, Role.FINANCE],
    delete: [Role.SUPER_ADMIN],
  },
  announcements: {
    create: [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR],
    read: [
      Role.SUPER_ADMIN,
      Role.ADMIN,
      Role.FINANCE,
      Role.INSTRUCTOR,
      Role.STUDENT,
      Role.PARENT,
    ],
    update: [Role.SUPER_ADMIN, Role.ADMIN],
    delete: [Role.SUPER_ADMIN, Role.ADMIN],
  },
  messages: {
    create: [
      Role.SUPER_ADMIN,
      Role.ADMIN,
      Role.FINANCE,
      Role.INSTRUCTOR,
      Role.STUDENT,
      Role.PARENT,
    ],
    read: [
      Role.SUPER_ADMIN,
      Role.ADMIN,
      Role.FINANCE,
      Role.INSTRUCTOR,
      Role.STUDENT,
      Role.PARENT,
    ],
    update: [Role.SUPER_ADMIN],
    delete: [Role.SUPER_ADMIN],
  },
  settings: {
    create: [Role.SUPER_ADMIN],
    read: [Role.SUPER_ADMIN, Role.ADMIN],
    update: [Role.SUPER_ADMIN],
    delete: [Role.SUPER_ADMIN],
  },
  users: {
    create: [Role.SUPER_ADMIN],
    read: [Role.SUPER_ADMIN],
    update: [Role.SUPER_ADMIN],
    delete: [Role.SUPER_ADMIN],
  },
};

export function hasRoutePermission(role: Role, path: string): boolean {
  // Find the matching route pattern
  const routeKey = Object.keys(ROUTE_PERMISSIONS).find((route) =>
    path.startsWith(route),
  );
  if (!routeKey) return true; // If no matching route, allow by default
  return ROUTE_PERMISSIONS[routeKey].includes(role);
}

export function canPerformAction(
  role: Role,
  module: string,
  action: Action,
): boolean {
  const permissions = MODULE_PERMISSIONS[module];
  if (!permissions) return false;
  return permissions[action]?.includes(role) ?? false;
}

export function isAdmin(role: Role): boolean {
  return role === Role.SUPER_ADMIN || role === Role.ADMIN;
}

export function isSuperAdmin(role: Role): boolean {
  return role === Role.SUPER_ADMIN;
}
