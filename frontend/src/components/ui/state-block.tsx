import Link from "next/link";
import { Inbox, Loader2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LoadingBlock({ message = "Loading...", className }: { message?: string; className?: string }) {
  return (
    <div className={cn("glass-panel flex min-h-[220px] flex-col items-center justify-center gap-3 p-8 text-center", className)}>
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  className,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("glass-panel flex min-h-[220px] flex-col items-center justify-center gap-4 p-8 text-center", className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Inbox className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {actionHref && actionLabel ? (
        <Button asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  className,
}: {
  title?: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn("glass-panel flex min-h-[220px] flex-col items-center justify-center gap-4 p-8 text-center", className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
