import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type OverlayConfig = {
  x?: string;
  y?: string;
  align?: "left" | "center" | "right" | string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  maxWidth?: string;
};

function getOverlayStyle(config: OverlayConfig = {}) {
  const align = config.align === "left" ? "left" : config.align === "right" ? "right" : "center";
  return {
    left: config.x ?? "50%",
    top: config.y ?? "50%",
    transform:
      align === "center"
        ? "translate(-50%, -50%)"
        : align === "right"
          ? "translate(-100%, -50%)"
          : "translate(0, -50%)",
    textAlign: align,
    fontSize: config.fontSize ? `${config.fontSize}px` : undefined,
    fontWeight: config.fontWeight,
    color: config.color,
    maxWidth: config.maxWidth,
  } as const;
}

export const RendererFrame = forwardRef<HTMLDivElement, {
  assetUrl?: string;
  fallbackGradient: string;
  patternOverlay?: string;
  colorTint?: string;
  className?: string;
  children: React.ReactNode;
}>(function RendererFrame({
  assetUrl,
  fallbackGradient,
  patternOverlay,
  colorTint,
  className,
  children,
}, ref) {
  return (
    <div
      ref={ref}
      className={cn("relative overflow-hidden rounded-[24px] border border-border/60 shadow-sm", className)}
      style={{
        backgroundImage: assetUrl ? `linear-gradient(rgba(15,23,42,0.18), rgba(15,23,42,0.28)), url(${assetUrl})` : fallbackGradient,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Colour tint overlay — applied over template image */}
      {colorTint ? (
        <div className="absolute inset-0" style={{ background: colorTint, mixBlendMode: "color", opacity: 0.45 }} />
      ) : null}
      {/* Card style pattern overlay — always applied */}
      {patternOverlay ? (
        <div
          className="absolute inset-0"
          style={{ backgroundImage: patternOverlay, backgroundRepeat: "repeat", backgroundSize: "60px 60px", opacity: 0.6 }}
        />
      ) : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.18),transparent_30%)]" />
      {children}
    </div>
  );
});

export function OverlayText({
  config,
  children,
  className,
}: {
  config?: OverlayConfig;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("absolute z-10 whitespace-pre-wrap", className)} style={getOverlayStyle(config)}>
      {children}
    </div>
  );
}
