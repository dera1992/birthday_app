"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function useToastError(error: Error | null | undefined, fallback = "Something went wrong.") {
  useEffect(() => {
    if (error) {
      toast.error(error.message || fallback);
    }
  }, [error, fallback]);
}
