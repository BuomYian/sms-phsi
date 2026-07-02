import { PhotoPanel } from "./photo-panel";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left: photo slideshow — hidden on small screens */}
      <div className="hidden lg:block lg:w-3/5 relative">
        <PhotoPanel />
      </div>

      {/* Right: form */}
      <div className="flex w-full lg:w-2/5 items-center justify-center bg-background px-6 py-12 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
