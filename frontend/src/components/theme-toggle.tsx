"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle({
  className,
  iconClassName,
  LightIcon = Moon,
  DarkIcon = SunMedium,
}: {
  className?: string;
  iconClassName?: string;
  LightIcon?: LucideIcon;
  DarkIcon?: LucideIcon;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle dark mode"
      className={className}
    >
      {isDark ? <DarkIcon className={iconClassName ?? "h-4 w-4"} /> : <LightIcon className={iconClassName ?? "h-4 w-4"} />}
    </Button>
  );
}
