"use client";

import { Copy, Download, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { GiftPurchase } from "@/features/gifts/types";

interface GiftAccessActionsProps {
  gift: Pick<GiftPurchase, "share_url" | "download_url" | "status">;
  compact?: boolean;
}

export function GiftAccessActions({ gift, compact = false }: GiftAccessActionsProps) {
  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(gift.share_url);
      toast.success("Gift link copied.");
    } catch {
      toast.error("Unable to copy gift link.");
    }
  }

  async function handleNativeShare() {
    if (!navigator.share) {
      handleCopyLink();
      return;
    }
    try {
      await navigator.share({ url: gift.share_url, title: "Digital gift" });
    } catch {
      // Ignore dismissed native share dialogs.
    }
  }

  const size = compact ? "sm" : "default";

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size={size} variant="outline" className="rounded-xl" onClick={handleCopyLink}>
        <Copy className="h-4 w-4" />
        Copy link
      </Button>
      <Button type="button" size={size} variant="outline" className="rounded-xl" onClick={handleNativeShare}>
        <Share2 className="h-4 w-4" />
        Share
      </Button>
      <Button
        type="button"
        size={size}
        asChild
        className="rounded-xl bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600"
      >
        <a href={gift.download_url} target="_blank" rel="noreferrer">
          <Download className="h-4 w-4" />
          {gift.status === "SUCCEEDED" ? "Download" : "Open export"}
        </a>
      </Button>
    </div>
  );
}
