"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorNotice } from "@/components/ui/error-notice";
import { useForgotPasswordConfirm } from "@/features/auth/api";
import { getErrorMessage } from "@/lib/api/errors";

const schema = z.object({
  new_password: z.string().min(8, "Password must be at least 8 characters."),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: "Passwords do not match.",
  path: ["confirm_password"],
});
type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { new_password: "", confirm_password: "" } });
  const mutation = useForgotPasswordConfirm();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    if (!uid || !token) {
      setSubmitError("Invalid or expired reset link. Please request a new one.");
      return;
    }
    try {
      await mutation.mutateAsync({ uid, token, new_password: values.new_password });
      toast.success("Password reset successfully. Please sign in.");
      router.push("/login");
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Unable to reset password. The link may have expired."));
    }
  }

  return (
    <main className="container flex min-h-[calc(100vh-5rem)] items-center justify-center py-10">
      <div className="w-full max-w-lg">
        <Link href="/" className="mb-6 flex justify-center">
          <Image src="/celnoia-logo.png" alt="Celnoia" width={130} height={40} className="h-10 w-auto" />
        </Link>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="font-display text-3xl">Set new password</CardTitle>
            <CardDescription>Choose a strong password for your Celnoia account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
              <ErrorNotice message={submitError} />
              <div className="space-y-2">
                <Label htmlFor="new_password">New password</Label>
                <div className="relative">
                  <Input
                    id="new_password"
                    type={showPassword ? "text" : "password"}
                    className="pr-12"
                    {...form.register("new_password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-sm text-destructive">{form.formState.errors.new_password?.message}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm password</Label>
                <Input id="confirm_password" type="password" {...form.register("confirm_password")} />
                <p className="text-sm text-destructive">{form.formState.errors.confirm_password?.message}</p>
              </div>
              <Button className="w-full" type="submit" disabled={mutation.isPending}>
                Reset password
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link href="/login">Back to sign in</Link>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
