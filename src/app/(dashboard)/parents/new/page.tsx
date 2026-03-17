import { ParentForm } from "./parent-form";

export const metadata = { title: "Add New Parent" };

export default function NewParentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add New Parent</h1>
        <p className="text-muted-foreground">
          Fill in the details below to create a new parent account.
        </p>
      </div>
      <ParentForm />
    </div>
  );
}
