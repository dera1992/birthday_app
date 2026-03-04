import { AuthGuard } from "@/components/auth-guard";
import { AppShell } from "@/components/app-shell";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
