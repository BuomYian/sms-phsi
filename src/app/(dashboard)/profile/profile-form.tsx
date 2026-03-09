"use client";

import { useActionState, useEffect } from "react";
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
import { toast } from "sonner";
import { User, Lock, Mail, Phone, Shield } from "lucide-react";
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
  };
}

const initialState: ProfileActionState = {};

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

  return (
    <div className="space-y-6">
      {/* Profile Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl">{user.fullName}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Mail className="h-3.5 w-3.5" />
              {user.email}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs">
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
              <p className="font-medium">
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                />
              </div>
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
