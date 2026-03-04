"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Eye, EyeOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/auth-context";
import { useChangePassword, useUpdateMe } from "@/features/auth/api";
import { getErrorMessage } from "@/lib/api/errors";
import { accountSettingsSchema, changePasswordSchema } from "@/lib/validators/auth";

type AccountSettingsValues = z.infer<typeof accountSettingsSchema>;
type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export default function SettingsPage() {
  const { user, isPhoneVerified } = useAuth();
  const updateMe = useUpdateMe();
  const changePassword = useChangePassword();
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const profileForm = useForm<AccountSettingsValues>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone_number: "",
    },
  });
  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
    },
  });

  useEffect(() => {
    if (!user) return;
    profileForm.reset({
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      phone_number: user.verification?.phone_number ?? "",
    });
  }, [profileForm, user]);

  async function onSaveProfile(values: AccountSettingsValues) {
    setProfileError(null);
    try {
      await updateMe.mutateAsync(values);
      toast.success("Account details updated.");
    } catch (error) {
      setProfileError(getErrorMessage(error, "Unable to update account details."));
    }
  }

  async function onChangePassword(values: ChangePasswordValues) {
    setPasswordError(null);
    try {
      await changePassword.mutateAsync(values);
      passwordForm.reset();
      toast.success("Password changed successfully.");
    } catch (error) {
      setPasswordError(getErrorMessage(error, "Unable to change password."));
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Badge>Account</Badge>
          <CardTitle className="pt-3 font-display text-4xl">Settings</CardTitle>
          <CardDescription>Review your account details, keep your phone number current, and update your password when needed.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Account details</CardTitle>
            <CardDescription>Your email is your login identity. Names and phone number can be updated here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ErrorNotice message={profileError} />
            <div className="rounded-[22px] border border-border bg-secondary/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Login email</p>
              <p className="mt-2 text-base font-medium">{user?.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={isPhoneVerified ? "success" : "warning"}>
                Phone {isPhoneVerified ? "verified" : "not verified"}
              </Badge>
              <Badge variant={user?.verification?.email_verified_at ? "success" : "outline"}>
                Email {user?.verification?.email_verified_at ? "verified" : "unverified"}
              </Badge>
            </div>

            <form className="space-y-4" onSubmit={profileForm.handleSubmit(onSaveProfile)}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First name</Label>
                  <Input id="first_name" {...profileForm.register("first_name")} />
                  <p className="text-sm text-destructive">{profileForm.formState.errors.first_name?.message}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last name</Label>
                  <Input id="last_name" {...profileForm.register("last_name")} />
                  <p className="text-sm text-destructive">{profileForm.formState.errors.last_name?.message}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone number</Label>
                <Input id="phone_number" placeholder="+447700900123" {...profileForm.register("phone_number")} />
                <p className="text-sm text-destructive">{profileForm.formState.errors.phone_number?.message}</p>
              </div>
              <Button type="submit" disabled={updateMe.isPending}>
                Save account details
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Birthday profile</CardTitle>
              <CardDescription>
                Your birthday profile is required before you can create or apply to events. Keep it complete so hosts can review you properly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant={user?.birthday_profile_slug ? "success" : "warning"}>
                  {user?.birthday_profile_slug ? "Profile created" : "Profile missing"}
                </Badge>
                <Badge variant={user?.birthday_profile_completed ? "success" : "warning"}>
                  {user?.birthday_profile_completed ? "Profile complete" : "Profile incomplete"}
                </Badge>
              </div>
              <Button variant="outline" asChild>
                <Link href={user?.birthday_profile_slug ? `/birthday-profile/${user.birthday_profile_slug}/edit` : "/birthday-profile/new"}>
                  {user?.birthday_profile_slug ? "Edit birthday profile" : "Create birthday profile"}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Use a strong password and update it whenever you suspect your account has been shared.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={passwordForm.handleSubmit(onChangePassword)}>
                <ErrorNotice message={passwordError} />
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current password</Label>
                  <div className="relative">
                    <Input id="current_password" type={showCurrentPassword ? "text" : "password"} className="pr-10" {...passwordForm.register("current_password")} />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowCurrentPassword((v) => !v)}
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.current_password?.message}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_password">New password</Label>
                  <div className="relative">
                    <Input id="new_password" type={showNewPassword ? "text" : "password"} className="pr-10" {...passwordForm.register("new_password")} />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowNewPassword((v) => !v)}
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.new_password?.message}</p>
                </div>
                <Button type="submit" disabled={changePassword.isPending}>
                  Change password
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-500 to-red-500 text-white">
            <CardHeader>
              <CardTitle>Verification reminder</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-white/85">
              Your phone number is used for event trust checks. If you update it here, request a fresh OTP from the verification flow before applying to new events.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
