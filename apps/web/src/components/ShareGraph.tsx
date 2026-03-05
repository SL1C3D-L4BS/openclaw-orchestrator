"use client";

import { useCallback } from "react";
import { Share2 } from "lucide-react";
import { captureElementAsPng } from "@/lib/snapshot";

const TWEET_TEMPLATE =
  "Just built a PQC-Verified Skill for @OpenClaw using Vericore OS. 🕹️🛡️ #OpenClaw #AI #Vericore";

export function getTweetUrl(text: string = TWEET_TEMPLATE): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

interface ShareGraphProps {
  flowContainerRef: React.RefObject<HTMLElement | null>;
  onCapture?: (dataUrl: string) => void;
}

export default function ShareGraph({
  flowContainerRef,
  onCapture,
}: ShareGraphProps) {
  const handleShareToX = useCallback(async () => {
    const dataUrl = await captureElementAsPng(flowContainerRef.current);
    if (dataUrl && onCapture) onCapture(dataUrl);
    window.open(getTweetUrl(), "_blank", "noopener,noreferrer,width=550,height=420");
  }, [flowContainerRef, onCapture]);

  return (
    <button
      type="button"
      onClick={handleShareToX}
      className="flex items-center gap-2 rounded-lg border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
      title="Share to X"
    >
      <Share2 className="w-4 h-4" />
      Share to X
    </button>
  );
}
