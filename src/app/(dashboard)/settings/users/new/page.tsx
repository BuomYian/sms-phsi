import NewUserForm from "./new-user-form";

export const metadata = { title: "Add User" };

export default function NewUserPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add User</h1>
        <p className="text-muted-foreground">Create a new system user.</p>
      </div>
      <NewUserForm />
    </div>
  );
}
