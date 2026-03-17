"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User,
  Lock,
  Mail,
  Phone,
  Shield,
  Eye,
  EyeOff,
  GraduationCap,
  Briefcase,
  Calendar,
  Building2,
} from "lucide-react";
import {
  updateProfileAction,
  changePasswordAction,
  type ProfileActionState,
} from "./actions";

interface ProfileFormProps {
  user: {
    fullName: string;
    email: string;
    phone: string | null;
    role: string;
    avatarUrl: string | null;
    createdAt: string;
    studentIdNumber?: string | null;
    staffIdNumber?: string | null;
    studentProgram?: string | null;
    studentYear?: number | null;
    studentStatus?: string | null;
    studentAdmissionDate?: string | null;
    staffDesignation?: string | null;
    staffDepartment?: string | null;
    staffEmploymentType?: string | null;
    staffDateOfHire?: string | null;
  };
}

const initialState: ProfileActionState = {};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const roleBadgeColors: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  ADMIN:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  INSTRUCTOR:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  STUDENT:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  FINANCE:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  PARENT: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
};

function PasswordInput({
  id,
  name,
  label,
}: {
  id: string;
  name: string;
  label: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          required
          minLength={6}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          onClick={() => setShow((s) => !s)}
          tabIndex={-1}
        >
          {show ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    </div>
  );
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [profileState, profileAction, profilePending] = useActionState(
    updateProfileAction,
    initialState,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    changePasswordAction,
    initialState,
  );

  useEffect(() => {
    if (profileState.success) toast.success(profileState.message);
    if (profileState.error) toast.error(profileState.error);
  }, [profileState]);

  useEffect(() => {
    if (passwordState.success) toast.success(passwordState.message);
    if (passwordState.error) toast.error(passwordState.error);
  }, [passwordState]);

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    INSTRUCTOR: "Instructor",
    STUDENT: "Student",
    FINANCE: "Finance",
    PARENT: "Parent",
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="space-y-6">
      {/* Profile Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-lg select-none">
            {getInitials(user.fullName)}
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl">{user.fullName}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Mail className="h-3.5 w-3.5" />
              {user.email}
            </CardDescription>
          </div>
          <Badge
            variant="secondary"
            className={`text-xs border-0 ${roleBadgeColors[user.role] ?? ""}`}
          >
            <Shield className="h-3 w-3 mr-1" />
            {roleLabels[user.role] ?? user.role}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {user.studentIdNumber && (
              <div>
                <p className="text-muted-foreground">Student ID</p>
                <p className="font-medium">{user.studentIdNumber}</p>
              </div>
            )}
            {user.staffIdNumber && (
              <div>
                <p className="text-muted-foreground">Staff ID</p>
                <p className="font-medium">{user.staffIdNumber}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium">{user.phone || "Not set"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Member Since</p>
              <p className="font-medium">{formatDate(user.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student-specific Info */}
      {user.studentIdNumber && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Academic Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {user.studentProgram && (
                <div>
                  <p className="text-muted-foreground">Program</p>
                  <p className="font-medium">{user.studentProgram}</p>
                </div>
              )}
              {user.studentYear && (
                <div>
                  <p className="text-muted-foreground">Year of Study</p>
                  <p className="font-medium">Year {user.studentYear}</p>
                </div>
              )}
              {user.studentStatus && (
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge
                    variant="secondary"
                    className={
                      user.studentStatus === "ACTIVE"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }
                  >
                    {user.studentStatus}
                  </Badge>
                </div>
              )}
              {user.studentAdmissionDate && (
                <div>
                  <p className="text-muted-foreground">Admission Date</p>
                  <p className="font-medium">
                    {formatDate(user.studentAdmissionDate)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff-specific Info */}
      {user.staffIdNumber && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Employment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {user.staffDesignation && (
                <div>
                  <p className="text-muted-foreground">Designation</p>
                  <p className="font-medium">{user.staffDesignation}</p>
                </div>
              )}
              {user.staffDepartment && (
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> Department
                  </p>
                  <p className="font-medium">{user.staffDepartment}</p>
                </div>
              )}
              {user.staffEmploymentType && (
                <div>
                  <p className="text-muted-foreground">Employment Type</p>
                  <Badge variant="outline">
                    {user.staffEmploymentType.replaceAll("_", " ")}
                  </Badge>
                </div>
              )}
              {user.staffDateOfHire && (
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Date of Hire
                  </p>
                  <p className="font-medium">
                    {formatDate(user.staffDateOfHire)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Update Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-4 w-4" />
            Update Profile
          </CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={profileAction} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  defaultValue={user.fullName}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={user.phone ?? ""}
                    className="pl-9"
                    placeholder="+211 ..."
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Contact an administrator to change your email.
              </p>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={profilePending}>
                {profilePending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password. You will need to enter your current password
            for verification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={passwordAction} className="space-y-4">
            <PasswordInput
              id="currentPassword"
              name="currentPassword"
              label="Current Password"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <PasswordInput
                id="newPassword"
                name="newPassword"
                label="New Password"
              />
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm New Password"
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="outline"
                disabled={passwordPending}
              >
                {passwordPending ? "Updating..." : "Change Password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
