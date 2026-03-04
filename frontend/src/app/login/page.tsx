"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoginMutation, useForgotPasswordRequest } from "@/features/auth/api";
import { useAuth } from "@/features/auth/auth-context";
import { getErrorMessage } from "@/lib/api/errors";
import { loginSchema } from "@/lib/validators/auth";

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const searchParams = useSearchParams();
  const verificationNextPath = searchParams.get("next") || "/";
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const loginMutation = useLoginMutation();
  const forgotMutation = useForgotPasswordRequest();
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(values: LoginValues) {
    setSubmitError(null);
    try {
      const tokens = await loginMutation.mutateAsync(values);
      login(tokens, `/verify-email?next=${encodeURIComponent(verificationNextPath)}`);
      toast.success("Signed in successfully.");
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Unable to sign in."));
    }
  }

  async function handleForgotPassword() {
    setSubmitError(null);
    const email = form.getValues("email");
    if (!email) {
      toast.error("Enter your email first.");
      return;
    }
    try {
      const response = await forgotMutation.mutateAsync({ email });
      toast.success(response.detail);
      if (response.uid && response.token) {
        toast.info(`Dev reset token ready. UID: ${response.uid}`);
      }
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Unable to start password reset."));
    }
  }

  return (
    <main className="container flex min-h-[calc(100vh-5rem)] items-center justify-center py-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="font-display text-3xl">Welcome back</CardTitle>
          <CardDescription>Use your email and password to continue to your planning dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            <ErrorNotice message={submitError} />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
              <p className="text-sm text-destructive">{form.formState.errors.email?.message}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} className="pr-12" {...form.register("password")} />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-sm text-destructive">{form.formState.errors.password?.message}</p>
            </div>
            <Button className="w-full" type="submit" disabled={loginMutation.isPending}>
              Sign in
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={handleForgotPassword} disabled={forgotMutation.isPending}>
              Forgot password
            </Button>
          </form>
          <p className="mt-6 text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/register" className="font-semibold text-primary">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
