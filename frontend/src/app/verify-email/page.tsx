"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorNotice } from "@/components/ui/error-notice";
import { useAuth } from "@/features/auth/auth-context";
import { useConfirmEmailVerification, useVerifyEmail } from "@/features/auth/api";
import { getErrorMessage } from "@/lib/api/errors";

export default function VerifyEmailPage() {
  const { isAuthenticated, isEmailVerified, isLoading, isReady, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");
  const sent = searchParams.get("sent");
  const sendVerification = useVerifyEmail();
  const confirmVerification = useConfirmEmailVerification();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (uid && token && !confirmVerification.isPending && !confirmed) {
      confirmVerification
        .mutateAsync({ uid, token })
        .then(() => {
          setConfirmed(true);
          toast.success("Email verified.");
          if (isAuthenticated) {
            router.replace(`/verify?next=${encodeURIComponent(nextPath)}`);
            return;
          }
          router.replace(`/login?emailVerified=1&next=${encodeURIComponent(nextPath)}`);
        })
        .catch((error) => {
          setSubmitError(getErrorMessage(error, "Unable to verify email."));
        });
    }
  }, [confirmVerification, confirmed, isAuthenticated, nextPath, router, token, uid]);

  useEffect(() => {
    if (isReady && !isLoading && isAuthenticated && isEmailVerified && !uid && !token) {
      router.replace(`/verify?next=${encodeURIComponent(nextPath)}`);
    }
  }, [isAuthenticated, isEmailVerified, isLoading, isReady, nextPath, router, token, uid]);

  async function handleResend() {
    setSubmitError(null);
    try {
      const response = await sendVerification.mutateAsync();
      toast.success(response.detail);
      if (response.verification_url) {
        toast.info("Verification link generated in the backend logs for local development.");
      }
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Unable to send verification email."));
    }
  }

  return (
    <main className="container py-10 md:py-16">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <Badge variant="outline">Step 1 of 2</Badge>
            <CardTitle className="pt-3 font-display text-4xl">Verify your email first</CardTitle>
            <CardDescription>
              We send a verification link to your inbox before phone verification. Once your email is confirmed, you will continue to the existing phone step.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ErrorNotice message={submitError} />
            <div className="rounded-[24px] border border-border bg-background/70 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MailCheck className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <p className="font-semibold">Inbox check</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.email
                      ? `Use the verification email sent to ${user.email}.`
                      : "Open the link from your email to verify this account."}
                  </p>
                </div>
              </div>
            </div>
            {sent ? (
              <p className="text-sm text-muted-foreground">
                A verification email has been sent. Open the link in that email, then you will continue to phone verification.
              </p>
            ) : null}
            {!uid && !token ? (
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleResend} disabled={!isAuthenticated || sendVerification.isPending}>
                  Resend verification email
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">Back to home</Link>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Verifying your email...</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
