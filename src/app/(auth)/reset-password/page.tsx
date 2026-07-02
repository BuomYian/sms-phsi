"use client";

import { useActionState, useState } from "react";
import {
  lookupSecurityQuestionAction,
  resetPasswordAction,
  type ResetState,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [lookupState, lookupAction, lookupPending] = useActionState<
    ResetState,
    FormData
  >(lookupSecurityQuestionAction, { step: "email" });

  const [resetState, resetAction, resetPending] = useActionState<
    ResetState,
    FormData
  >(resetPasswordAction, {});

  const [backToEmail, setBackToEmail] = useState(false);

  const step =
    resetState.step === "done" && resetState.success
      ? "done"
      : lookupState.step === "question" &&
          lookupState.securityQuestion &&
          !backToEmail
        ? "question"
        : "email";

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="flex flex-col items-center space-y-3 text-center">
        <Image
          src="/phsi-logo.png"
          alt="PHSI Logo"
          width={96}
          height={96}
          className="object-contain rounded-full"
          priority
        />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">PHSI</h1>
          <p className="text-sm text-muted-foreground">
            Presbyterian Health Science Institute
          </p>
        </div>
      </div>

      {step === "done" ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
            <p className="font-medium">
              {resetState.message || "Password reset successfully!"}
            </p>
            <Button asChild className="w-full">
              <Link href="/login">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      ) : step === "question" ? (
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Security Question</CardTitle>
            <CardDescription>
              Answer your security question to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={resetAction} className="space-y-4">
              {resetState.error && (
                <Alert variant="destructive">
                  <AlertDescription>{resetState.error}</AlertDescription>
                </Alert>
              )}

              <input
                type="hidden"
                name="email"
                value={lookupState.email || ""}
              />

              <div className="rounded-md bg-muted p-3 text-sm">
                <p className="font-medium">
                  {lookupState.securityQuestion || resetState.securityQuestion}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="answer">Your Answer</Label>
                <Input
                  id="answer"
                  name="answer"
                  required
                  placeholder="Enter your answer"
                  disabled={resetPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  disabled={resetPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  disabled={resetPending}
                />
              </div>

              <Button type="submit" className="w-full" disabled={resetPending}>
                {resetPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setBackToEmail(true)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Reset Password</CardTitle>
            <CardDescription>
              Enter your email to begin the password reset process.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={lookupAction} className="space-y-4">
              {lookupState.error && (
                <Alert variant="destructive">
                  <AlertDescription>{lookupState.error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  disabled={lookupPending}
                />
              </div>

              <Button type="submit" className="w-full" disabled={lookupPending}>
                {lookupPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Looking up...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>

              <Button variant="ghost" className="w-full" asChild>
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign in
                </Link>
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
