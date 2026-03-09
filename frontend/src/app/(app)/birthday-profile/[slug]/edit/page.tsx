"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState, LoadingBlock } from "@/components/ui/state-block";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/auth-context";
import { useBirthdayProfile, useUpdateBirthdayProfile, useUploadProfileImage } from "@/features/birthday/api";
import { MultiSelectDropdown } from "@/features/birthday/profile-form-dropdown";
import { INTEREST_OPTIONS, OCCUPATION_OPTIONS } from "@/features/birthday/profile-form-options";
import { getErrorMessage } from "@/lib/api/errors";
import { birthdayProfileDetailsSchema } from "@/lib/validators/birthday";

type BirthdayProfileEditorValues = z.infer<typeof birthdayProfileDetailsSchema> & {
  hide_year: boolean;
  visibility: "PRIVATE" | "LINK_ONLY" | "PUBLIC";
};

export default function EditBirthdayProfilePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const { user } = useAuth();
  const profileQuery = useBirthdayProfile(slug);
  const updateProfile = useUpdateBirthdayProfile(slug);
  const uploadImage = useUploadProfileImage(slug);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const form = useForm<BirthdayProfileEditorValues>({
    resolver: zodResolver(
      birthdayProfileDetailsSchema.extend({
        hide_year: z.boolean(),
        visibility: z.enum(["PRIVATE", "LINK_ONLY", "PUBLIC"]),
      })
    ),
    defaultValues: {
      hide_year: true,
      visibility: "PUBLIC",
      bio: "",
      interests: "",
      gender: "",
      date_of_birth: "",
      marital_status: "",
      occupation: "",
      instagram: "",
      tiktok: "",
      linkedin: "",
      x: "",
    },
  });
  const profile = profileQuery.data;

  useEffect(() => {
    if (!profile) return;
    const interests = Array.isArray(profile.preferences?.interests) ? profile.preferences.interests : [];
    setSelectedInterests(interests);
    form.reset({
      hide_year: profile.hide_year,
      visibility: profile.visibility as "PRIVATE" | "LINK_ONLY" | "PUBLIC",
      bio: profile.bio ?? "",
      interests: interests.join(", "),
      gender: profile.gender ?? "",
      date_of_birth: profile.date_of_birth ?? "",
      marital_status: profile.marital_status ?? "",
      occupation: profile.occupation ?? "",
      instagram: profile.social_links?.instagram ?? "",
      tiktok: profile.social_links?.tiktok ?? "",
      linkedin: profile.social_links?.linkedin ?? "",
      x: profile.social_links?.x ?? "",
    });
  }, [form, profile]);

  useEffect(() => {
    form.setValue("interests", selectedInterests.join(", "));
  }, [form, selectedInterests]);

  useEffect(() => {
    if (profile && user?.id && profile.user !== user.id) {
      router.replace(`/birthday/${slug}`);
    }
  }, [profile, router, slug, user?.id]);

  async function onSubmit(values: BirthdayProfileEditorValues) {
    setSubmitError(null);
    try {
      await updateProfile.mutateAsync({
        hide_year: values.hide_year,
        visibility: values.visibility,
        bio: values.bio,
        preferences: {
          ...(profile?.preferences ?? {}),
          interests: values.interests
            ? values.interests
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean)
            : [],
        },
        social_links: {
          instagram: values.instagram || "",
          tiktok: values.tiktok || "",
          linkedin: values.linkedin || "",
          x: values.x || "",
        },
        gender: values.gender || "",
        date_of_birth: values.date_of_birth || null,
        marital_status: values.marital_status || "",
        occupation: values.occupation || "",
      });
      toast.success("Birthday profile updated.");
      router.push(`/birthday/${slug}`);
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Unable to update the birthday profile."));
    }
  }

  if (profileQuery.isLoading) {
    return <LoadingBlock message="Loading birthday profile..." />;
  }

  if (profileQuery.error) {
    return <ErrorState description={getErrorMessage(profileQuery.error, "Unable to load this birthday profile.")} />;
  }

  if (!profile) {
    return <ErrorState description="Birthday profile not found." />;
  }

  if (user?.id && profile.user !== user.id) {
    return <ErrorState title="Access denied" description="Only the profile owner can edit this birthday profile." />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge>Birthday profile</Badge>
            <CardTitle className="pt-3 font-display text-4xl">Edit birthday profile</CardTitle>
            <CardDescription>Update the profile your friends and potential hosts see when they review you.</CardDescription>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/birthday/${slug}`}>Back to birthday page</Link>
          </Button>
        </CardHeader>
      </Card>

      {/* Profile image upload */}
      <Card>
        <CardHeader>
          <CardTitle>Profile photo</CardTitle>
          <CardDescription>Shown on your public birthday page.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-5">
            {profile.profile_image ? (
              <img
                src={profile.profile_image}
                alt="Current profile"
                className="h-20 w-20 rounded-full border border-border object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-border text-muted-foreground text-2xl">
                ?
              </div>
            )}
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    await uploadImage.mutateAsync(file);
                    toast.success("Profile photo updated.");
                  } catch (err) {
                    toast.error(getErrorMessage(err, "Unable to upload image."));
                  }
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploadImage.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadImage.isPending ? "Uploading…" : profile.profile_image ? "Change photo" : "Upload photo"}
              </Button>
              <p className="text-xs text-muted-foreground">JPG, PNG or WebP. Max 5 MB.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <form className="grid gap-6 lg:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="lg:col-span-2">
              <ErrorNotice message={submitError} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <select id="visibility" className="flex h-11 w-full rounded-2xl border border-input bg-background/80 px-4 text-sm" {...form.register("visibility")}>
                <option value="PUBLIC">Public</option>
                <option value="LINK_ONLY">Link only</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...form.register("hide_year")} />
                Hide birth year
              </label>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" {...form.register("bio")} />
              {form.formState.errors.bio && (
                <p className="text-xs text-destructive">{form.formState.errors.bio.message}</p>
              )}
            </div>

            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="interests">Interests <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <input type="hidden" {...form.register("interests")} />
              <MultiSelectDropdown
                options={INTEREST_OPTIONS}
                selected={selectedInterests}
                onChange={setSelectedInterests}
                placeholder="Select interests"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <select id="gender" className="flex h-11 w-full rounded-2xl border border-input bg-background/80 px-4 text-sm" {...form.register("gender")}>
                <option value="">Not set</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of birth</Label>
              <Input id="date_of_birth" type="date" {...form.register("date_of_birth")} />
              {form.formState.errors.date_of_birth && (
                <p className="text-xs text-destructive">{form.formState.errors.date_of_birth.message}</p>
              )}
              <p className="text-xs text-muted-foreground">Birthday day and month are derived from this date automatically.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="marital_status">Marital status</Label>
              <select id="marital_status" className="flex h-11 w-full rounded-2xl border border-input bg-background/80 px-4 text-sm" {...form.register("marital_status")}>
                <option value="">Not set</option>
                <option value="SINGLE">Single</option>
                <option value="IN_A_RELATIONSHIP">In a relationship</option>
                <option value="MARRIED">Married</option>
                <option value="DIVORCED">Divorced</option>
                <option value="WIDOWED">Widowed</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <select
                id="occupation"
                className="flex h-11 w-full rounded-2xl border border-input bg-background/80 px-4 text-sm"
                {...form.register("occupation")}
              >
                <option value="">Not set</option>
                {OCCUPATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <p className="mb-4 text-sm font-medium">
                Social links <span className="text-muted-foreground font-normal">(all optional)</span>
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input id="instagram" placeholder="https://instagram.com/you" {...form.register("instagram")} />
                  {form.formState.errors.instagram && (
                    <p className="text-xs text-destructive">{form.formState.errors.instagram.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiktok">TikTok</Label>
                  <Input id="tiktok" placeholder="https://tiktok.com/@you" {...form.register("tiktok")} />
                  {form.formState.errors.tiktok && (
                    <p className="text-xs text-destructive">{form.formState.errors.tiktok.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input id="linkedin" placeholder="https://linkedin.com/in/you" {...form.register("linkedin")} />
                  {form.formState.errors.linkedin && (
                    <p className="text-xs text-destructive">{form.formState.errors.linkedin.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="x">X</Label>
                  <Input id="x" placeholder="https://x.com/you" {...form.register("x")} />
                  {form.formState.errors.x && (
                    <p className="text-xs text-destructive">{form.formState.errors.x.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? "Saving…" : "Save birthday profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
