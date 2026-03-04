"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { VerificationPanel } from "@/features/auth/components/verification-panel";
import { useAuth } from "@/features/auth/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function VerifyPage() {
  const { isAuthenticated, isEmailVerified, isLoading, isPhoneVerified, isReady, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";

  useEffect(() => {
    if (isReady && !isLoading && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    if (isReady && !isLoading && isAuthenticated && !isEmailVerified) {
      router.replace(`/verify-email?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    if (isReady && !isLoading && isAuthenticated && isPhoneVerified) {
      const destination =
        nextPath === "/" && user?.birthday_profile_slug
          ? `/birthday/${user.birthday_profile_slug}`
          : nextPath;
      router.replace(destination);
    }
  }, [isAuthenticated, isEmailVerified, isLoading, isPhoneVerified, isReady, nextPath, router, user?.birthday_profile_slug]);

  if (!isReady || isLoading || !isAuthenticated) {
    return (
      <main className="container flex min-h-[calc(100vh-5rem)] items-center justify-center py-10">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">Loading verification...</CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container py-10 md:py-16">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-5">
          <Badge variant="outline">Required before app access</Badge>
          <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Verify your phone once, then move through the app without friction.
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
            {user?.first_name ? `${user.first_name}, ` : ""}
            phone verification is the trust gate for hosting, applying, and protected event participation. Shared birthday pages remain easy to view, but account actions require a verified number.
          </p>
          <div className="rounded-[28px] border border-border bg-card/70 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <p className="font-semibold">Why we require this up front</p>
                <p className="text-sm text-muted-foreground">
                  It keeps event applications cleaner, reduces fake activity, and prevents you from hitting confusing errors later when you are ready to join or host something.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </section>

        <VerificationPanel
          title="Complete phone verification"
          description="Request a one-time code, verify your number, and you will be redirected back to where you were going."
          compact
        />
      </div>
    </main>
  );
}
