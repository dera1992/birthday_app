"use client";

import type { UseFormReturn } from "react-hook-form";
import { Eye, EyeOff, Globe, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { GiftCustomizationField, GiftProduct } from "@/features/gifts/types";
import type { GiftCustomizeValues } from "@/lib/validators/gifts";

function getFieldError(form: UseFormReturn<GiftCustomizeValues>, name: string) {
  const errors = form.formState.errors.customization_data as Record<string, { message?: string }> | undefined;
  return errors?.[name]?.message;
}

function isSenderField(field: GiftCustomizationField) {
  return field.name === "sender_name" || field.name === "from_name";
}

export function DynamicGiftCustomizationForm({
  form,
  product,
  isLoggedIn,
}: {
  form: UseFormReturn<GiftCustomizeValues>;
  product: GiftProduct;
  isLoggedIn: boolean;
}) {
  const visibility = form.watch("visibility");
  const isAnonymous = form.watch("is_anonymous");

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Visibility</label>
        <p className="text-xs text-muted-foreground">Public or private. The celebrant always receives it.</p>
        <div className="mt-2 flex gap-2">
          {(["PUBLIC", "PRIVATE"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => form.setValue("visibility", value)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium transition",
                visibility === value
                  ? "border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                  : "border-border bg-background/80 text-muted-foreground hover:border-rose-200"
              )}
            >
              {value === "PUBLIC" ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {value === "PUBLIC" ? "Public" : "Private"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-background/80 px-4 py-3">
        <div className="flex items-center gap-2">
          {isAnonymous ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
          <div>
            <p className="text-sm font-medium">Send anonymously</p>
            <p className="text-xs text-muted-foreground">
              {product.allow_anonymous_sender ? "Hide your name from the celebrant." : "Anonymous sending is disabled for this gift."}
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isAnonymous}
          disabled={!product.allow_anonymous_sender}
          onClick={() => form.setValue("is_anonymous", !isAnonymous)}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            isAnonymous ? "bg-rose-500" : "bg-muted"
          )}
        >
          <span
            className={cn(
              "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
              isAnonymous ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>
      {form.formState.errors.is_anonymous?.message ? (
        <p className="text-xs text-destructive">{form.formState.errors.is_anonymous.message}</p>
      ) : null}

      {product.purchase_instructions ? (
        <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          {product.purchase_instructions}
        </div>
      ) : null}

      {(product.customization_schema?.fields ?? [])
        .filter((field) => !(isAnonymous && isSenderField(field)))
        .map((field) => {
          const error = getFieldError(form, field.name);
          const fieldPath = `customization_data.${field.name}` as never;
          const toggleValue = Boolean(form.watch(fieldPath));

          return (
            <div key={field.name} className="space-y-1.5">
              <label className="text-sm font-medium">
                {field.label}
                {!field.required ? <span className="text-muted-foreground"> (optional)</span> : null}
              </label>

              {field.type === "textarea" ? (
                <Textarea
                  rows={3}
                  placeholder={field.placeholder ?? ""}
                  {...form.register(fieldPath)}
                />
              ) : null}

              {field.type === "text" ? (
                <Input placeholder={field.placeholder ?? ""} {...form.register(fieldPath)} />
              ) : null}

              {field.type === "select" ? (
                <select
                  className="flex h-11 w-full rounded-2xl border border-input bg-background/80 px-4 text-sm"
                  {...form.register(fieldPath)}
                >
                  <option value="">Select</option>
                  {(field.options ?? []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : null}

              {field.type === "color" ? (
                <Input type="color" className="h-11 p-2" {...form.register(fieldPath)} />
              ) : null}

              {field.type === "number" ? (
                <Input
                  type="number"
                  placeholder={field.placeholder ?? ""}
                  {...form.register(fieldPath, { valueAsNumber: true })}
                />
              ) : null}

              {field.type === "toggle" ? (
                <Button
                  type="button"
                  variant={toggleValue ? "default" : "outline"}
                  className="w-full justify-start rounded-xl"
                  onClick={() => form.setValue(fieldPath, (!toggleValue) as never)}
                >
                  {toggleValue ? "On" : "Off"}
                </Button>
              ) : null}

              {error ? <p className="text-xs text-destructive">{error}</p> : null}
            </div>
          );
        })}

      {!isLoggedIn && !isAnonymous ? (
        <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your details</p>
          <Input placeholder="Your name" {...form.register("buyer_name")} />
          {form.formState.errors.buyer_name?.message ? (
            <p className="text-xs text-destructive">{form.formState.errors.buyer_name.message}</p>
          ) : null}
          <Input type="email" placeholder="your@email.com" {...form.register("buyer_email")} />
          {form.formState.errors.buyer_email?.message ? (
            <p className="text-xs text-destructive">{form.formState.errors.buyer_email.message}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
