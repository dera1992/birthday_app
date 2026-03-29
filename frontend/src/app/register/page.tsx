"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
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
import { useLoginMutation, useRegisterMutation } from "@/features/auth/api";
import { useAuth } from "@/features/auth/auth-context";
import { getErrorMessage } from "@/lib/api/errors";
import { registerSchema } from "@/lib/validators/auth";

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { first_name: "", last_name: "", email: "", password: "" },
  });
  const registerMutation = useRegisterMutation();
  const loginMutation = useLoginMutation();
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(values: RegisterValues) {
    setSubmitError(null);
    try {
      await registerMutation.mutateAsync(values);
      const tokens = await loginMutation.mutateAsync({
        email: values.email,
        password: values.password,
      });
      login(tokens, "/verify-email?sent=1");
      toast.success("Account created. Check your email to verify it first.");
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Unable to create account."));
    }
  }

  return (
    <main className="container flex min-h-[calc(100vh-5rem)] items-center justify-center py-10">
      <div className="w-full max-w-2xl">
      <Link href="/" className="mb-6 flex justify-center">
        <Image src="/celnoia-logo.png" alt="Celnoia" width={130} height={40} className="h-10 w-auto" />
      </Link>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="font-display text-3xl">Create your celebration account</CardTitle>
          <CardDescription>Start with birthday pages, then unlock hosted events and protected payouts when you are ready.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="md:col-span-2">
              <ErrorNotice message={submitError} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="first_name">First name</Label>
              <Input id="first_name" {...form.register("first_name")} />
              <p className="text-sm text-destructive">{form.formState.errors.first_name?.message}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last name</Label>
              <Input id="last_name" {...form.register("last_name")} />
              <p className="text-sm text-destructive">{form.formState.errors.last_name?.message}</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
              <p className="text-sm text-destructive">{form.formState.errors.email?.message}</p>
            </div>
            <div className="space-y-2 md:col-span-2">
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
            <div className="md:col-span-2">
              <Button className="w-full" type="submit" disabled={registerMutation.isPending || loginMutation.isPending}>
                Create account
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                By signing up, you agree to the{" "}
                <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</Link>
                , including Cookie Use.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-primary">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </main>
  );
}
