import DepartmentForm from "./department-form";

export const metadata = { title: "New Department" };

export default function NewDepartmentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Department</h1>
        <p className="text-muted-foreground">Create a new department.</p>
      </div>
      <DepartmentForm />
    </div>
  );
}
