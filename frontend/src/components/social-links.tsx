import { Instagram, Linkedin, Music2, Twitter, type LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

type IconComponent = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

const SOCIAL_ICONS: Record<string, IconComponent> = {
  instagram: Instagram,
  linkedin: Linkedin,
  x: Twitter,
  tiktok: Music2,
};

interface SocialLinksProps {
  links: Record<string, string> | null | undefined;
  /** "icons" = circular icon buttons; "list" = icon + name full-width rows */
  variant?: "icons" | "list";
  className?: string;
  /** Extra classes applied to each icon button (e.g. for dark-background theming) */
  buttonClassName?: string;
}

export function SocialLinks({
  links,
  variant = "icons",
  className,
  buttonClassName,
}: SocialLinksProps) {
  const entries = Object.entries(links ?? {}).filter(([, v]) => Boolean(v));
  if (!entries.length) return null;

  if (variant === "list") {
    return (
      <div className={cn("space-y-2", className)}>
        {entries.map(([platform, url]) => {
          const Icon = SOCIAL_ICONS[platform.toLowerCase()];
          return (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "flex items-center gap-3 rounded-2xl border border-border px-3 py-2 text-sm text-primary transition hover:bg-muted/50",
                buttonClassName
              )}
            >
              {Icon ? (
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <span className="flex h-4 w-4 shrink-0 items-center justify-center text-xs font-semibold text-muted-foreground">
                  {platform[0].toUpperCase()}
                </span>
              )}
              <span className="capitalize">{platform}</span>
            </a>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {entries.map(([platform, url]) => {
        const Icon = SOCIAL_ICONS[platform.toLowerCase()];
        return (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noreferrer"
            aria-label={platform}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border transition",
              "border-border text-foreground hover:bg-muted",
              buttonClassName
            )}
          >
            {Icon ? (
              <Icon className="h-4 w-4" />
            ) : (
              <span className="text-xs font-semibold">{platform[0].toUpperCase()}</span>
            )}
          </a>
        );
      })}
    </div>
  );
}
