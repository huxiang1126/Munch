import { Suspense } from "react";

import { LoadingDots } from "@/components/shared/loading-dots";
import { StudioPage } from "@/components/studio/studio-page";

export default function StudioRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[36vh] items-center justify-center px-4 pb-36 pt-8">
          <LoadingDots label="Studio 加载中" />
        </div>
      }
    >
      <StudioPage />
    </Suspense>
  );
}
