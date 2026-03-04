import { cn, initials } from "@/lib/utils";

export function Avatar({ name, className }: { name?: string | null; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 via-red-500 to-orange-400 text-sm font-semibold text-white shadow-lg",
        className
      )}
    >
      {initials(name)}
    </div>
  );
}
