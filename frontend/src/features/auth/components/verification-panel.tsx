"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Mail, ShieldAlert, Smartphone } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/auth-context";
import { useRequestOtp, useVerifyEmail, useVerifyOtp } from "@/features/auth/api";
import { getErrorMessage } from "@/lib/api/errors";
import { requestOtpSchema, verifyOtpSchema } from "@/lib/validators/auth";

type RequestOtpValues = z.infer<typeof requestOtpSchema>;
type VerifyOtpValues = z.infer<typeof verifyOtpSchema>;

export function VerificationPanel({
  title = "Verification",
  description = "Complete verification to unlock event applications and stricter host criteria.",
  requireEmail = false,
  compact = false,
}: {
  title?: string;
  description?: string;
  requireEmail?: boolean;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const isAuthenticated = Boolean(user?.id);
  const verification = user?.verification;
  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();
  const verifyEmail = useVerifyEmail();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const requestForm = useForm<RequestOtpValues>({
    resolver: zodResolver(requestOtpSchema),
    defaultValues: { phone_number: verification?.phone_number || "" },
  });

  const verifyForm = useForm<VerifyOtpValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { code: "", phone_number: verification?.phone_number || "" },
  });

  const phoneVerified = Boolean(verification?.phone_verified_at);
  const emailVerified = Boolean(verification?.email_verified_at);

  async function handleRequestOtp(values: RequestOtpValues) {
    setSubmitError(null);
    if (!isAuthenticated) {
      setSubmitError("Sign in again before requesting a verification code.");
      return;
    }
    try {
      const response = await requestOtp.mutateAsync(values);
      toast.success(response.detail);
      if (response.dev_code) {
        toast.info(`Dev OTP: ${response.dev_code}`);
        verifyForm.setValue("code", response.dev_code);
      }
      verifyForm.setValue("phone_number", values.phone_number);
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Unable to request OTP."));
    }
  }

  async function handleVerifyOtp(values: VerifyOtpValues) {
    setSubmitError(null);
    if (!isAuthenticated) {
      setSubmitError("Sign in again before verifying your phone.");
      return;
    }
    try {
      await verifyOtp.mutateAsync(values);
      toast.success("Phone verified.");
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Unable to verify phone."));
    }
  }

  async function handleVerifyEmail() {
    setSubmitError(null);
    if (!isAuthenticated) {
      setSubmitError("Sign in again before resending your verification email.");
      return;
    }
    try {
      const response = await verifyEmail.mutateAsync();
      toast.success(response.detail);
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Unable to verify email."));
    }
  }

  return (
    <Card className={compact ? "" : "overflow-hidden"}>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={phoneVerified && (!requireEmail || emailVerified) ? "success" : "warning"}>
            {phoneVerified && (!requireEmail || emailVerified) ? "Ready to apply" : "Action needed"}
          </Badge>
          {!phoneVerified || (requireEmail && !emailVerified) ? <Badge variant="outline">Required before apply</Badge> : null}
        </div>
        <CardTitle className={compact ? "text-xl" : "font-display text-3xl"}>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ErrorNotice message={submitError} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[22px] border border-border bg-background/70 p-4">
            <div className="flex items-center gap-3">
              {phoneVerified ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Smartphone className="h-5 w-5 text-primary" />}
              <div>
                <p className="font-semibold">Phone verification</p>
                <p className="text-xs text-muted-foreground">{phoneVerified ? "Verified and ready for event applications." : "Required for all event applications."}</p>
              </div>
            </div>
          </div>
          <div className="rounded-[22px] border border-border bg-background/70 p-4">
            <div className="flex items-center gap-3">
              {emailVerified ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Mail className="h-5 w-5 text-primary" />}
              <div>
                <p className="font-semibold">Email verification</p>
                <p className="text-xs text-muted-foreground">
                  {requireEmail ? "Required for this event because the host requested verified-only attendance." : "Optional globally, but some events require it."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {!phoneVerified ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <form className="space-y-3" onSubmit={requestForm.handleSubmit(handleRequestOtp)}>
              <Label htmlFor="phone_number">Phone number</Label>
              <Input id="phone_number" placeholder="+447700900123" {...requestForm.register("phone_number")} />
              <p className="text-xs text-destructive">{requestForm.formState.errors.phone_number?.message}</p>
              <Button type="submit" className="w-full" disabled={requestOtp.isPending || !isAuthenticated}>
                Request OTP
              </Button>
            </form>

            <form className="space-y-3" onSubmit={verifyForm.handleSubmit(handleVerifyOtp)}>
              <Label htmlFor="code">OTP code</Label>
              <Input id="code" placeholder="123456" {...verifyForm.register("code")} />
              <Input className="hidden" {...verifyForm.register("phone_number")} />
              <p className="text-xs text-muted-foreground">In local dev, the backend returns the OTP code directly.</p>
              <Button type="submit" className="w-full" variant="outline" disabled={verifyOtp.isPending || !isAuthenticated}>
                Verify phone
              </Button>
            </form>
          </div>
        ) : null}

        {requireEmail && !emailVerified ? (
          <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-700 dark:text-amber-300" />
              <div className="flex-1">
                <p className="font-semibold text-amber-800 dark:text-amber-100">Email verification required for this event</p>
                <p className="mt-1 text-sm text-amber-700/90 dark:text-amber-100/80">
                  The host enabled verified-only criteria. Use the verification link from your inbox before applying.
                </p>
              </div>
              <Button size="sm" onClick={handleVerifyEmail} disabled={verifyEmail.isPending || !isAuthenticated}>
                Resend email
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
