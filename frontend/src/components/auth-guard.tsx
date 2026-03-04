"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/features/auth/auth-context";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isEmailVerified, isLoading, isPhoneVerified, isReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isReady && !isLoading && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (isReady && !isLoading && isAuthenticated && !isEmailVerified) {
      router.replace(`/verify-email?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (isReady && !isLoading && isAuthenticated && !isPhoneVerified) {
      router.replace(`/verify?next=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isEmailVerified, isLoading, isPhoneVerified, isReady, pathname, router]);

  if (!isReady || !isAuthenticated || !isEmailVerified || !isPhoneVerified) {
    return (
      <div className="container flex min-h-[70vh] items-center justify-center">
        <div className="glass-panel max-w-md p-8 text-center">
          <p className="text-sm text-muted-foreground">Checking your session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
