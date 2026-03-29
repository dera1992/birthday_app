"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorNotice } from "@/components/ui/error-notice";
import { useForgotPasswordRequest } from "@/features/auth/api";
import { getErrorMessage } from "@/lib/api/errors";

const schema = z.object({ email: z.string().email("Enter a valid email address.") });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "" } });
  const mutation = useForgotPasswordRequest();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      await mutation.mutateAsync(values);
      setSent(true);
      toast.success("Check your inbox for a reset link.");
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Unable to send reset email."));
    }
  }

  return (
    <main className="container flex min-h-[calc(100vh-5rem)] items-center justify-center py-10">
      <div className="w-full max-w-lg">
        <Link href="/" className="mb-6 flex justify-center">
          <Image src="/celnoia-logo.png" alt="Celnoia" width={130} height={40} className="h-7 w-auto sm:h-8 md:h-10" />
        </Link>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="font-display text-3xl">Forgot password?</CardTitle>
            <CardDescription>
              Enter your email and we&apos;ll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  If an account exists for that email, a reset link has been sent. Check your inbox.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">Back to sign in</Link>
                </Button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
                <ErrorNotice message={submitError} />
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" type="email" placeholder="you@example.com" {...form.register("email")} />
                  <p className="text-sm text-destructive">{form.formState.errors.email?.message}</p>
                </div>
                <Button className="w-full" type="submit" disabled={mutation.isPending}>
                  Send reset link
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/login">Back to sign in</Link>
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
