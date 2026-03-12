"use client";

import { Progress } from "@/components/ui/progress";
import { useGenerationStore } from "@/stores/generation-store";

export function ProgressIndicator() {
  const { progress, message } = useGenerationStore();

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-3xl border border-border/70 bg-black/20 p-6 text-center">
      <Progress value={progress} className="h-2 bg-white/10" />
      <div>
        <p className="text-lg font-medium text-text-primary">正在生成中...</p>
        <p className="mt-2 text-sm text-text-secondary">{message}</p>
      </div>
    </div>
  );
}
