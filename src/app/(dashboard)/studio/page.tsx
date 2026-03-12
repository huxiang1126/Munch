import { Suspense } from "react";

import { StudioPage } from "@/components/studio/studio-page";

export default function StudioRoute() {
  return (
    <Suspense fallback={<div className="px-4 pb-36 pt-8 text-sm text-text-tertiary">Studio 加载中...</div>}>
      <StudioPage />
    </Suspense>
  );
}
