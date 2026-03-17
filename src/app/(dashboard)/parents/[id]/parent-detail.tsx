"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  Calendar,
  User,
  GraduationCap,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteParentAction } from "../actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ParentDetailProps {
  parent: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    isActive: boolean;
    createdAt: Date;
    parentLinks: {
      id: string;
      student: {
        id: string;
        studentIdNumber: string;
        status: string;
        user: { fullName: string };
        program: { name: string } | null;
      };
    }[];
  };
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm">{value || "—"}</p>
      </div>
    </div>
  );
}

export function ParentDetail({ parent }: ParentDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/parents">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">
              {getInitials(parent.fullName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{parent.fullName}</h1>
              <Badge variant={parent.isActive ? "default" : "secondary"}>
                {parent.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{parent.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/parents/${parent.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isPending}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Parent</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {parent.fullName}? This will
                  remove their account and all student links. This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    startTransition(async () => {
                      const result = await deleteParentAction(parent.id);
                      if (result.success) {
                        toast.success(result.message);
                        router.push("/parents");
                      }
                      if (result.error) toast.error(result.error);
                    });
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InfoRow icon={User} label="Full Name" value={parent.fullName} />
          <InfoRow icon={Mail} label="Email" value={parent.email} />
          <InfoRow icon={Phone} label="Phone" value={parent.phone} />
          <InfoRow
            icon={Calendar}
            label="Account Created"
            value={formatDate(parent.createdAt)}
          />
        </CardContent>
      </Card>

      {/* Linked Children */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Linked Students
          </CardTitle>
          <CardDescription>
            Students linked to this parent account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {parent.parentLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No students linked to this parent yet. You can link students from
              the student detail page.
            </p>
          ) : (
            <div className="space-y-3">
              {parent.parentLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs">
                        {getInitials(link.student.user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {link.student.user.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {link.student.studentIdNumber} ·{" "}
                        {link.student.program?.name ?? "No program"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {link.student.status}
                    </Badge>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/students/${link.student.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
