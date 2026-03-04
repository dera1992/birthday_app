import { AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

export function ErrorNotice({ message, className }: { message?: string | null; className?: string }) {
  if (!message) return null;

  return (
    <div className={cn("rounded-[22px] border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive", className)}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4" />
        <p>{message}</p>
      </div>
    </div>
  );
}
