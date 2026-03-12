"use client";

import { useEffect, useRef } from "react";

import type { GenerationStatusEvent } from "@/types/api";

export function useSse(
  taskId: string | null,
  onStatus: (event: GenerationStatusEvent) => void,
) {
  const onStatusRef = useRef(onStatus);

  onStatusRef.current = onStatus;

  useEffect(() => {
    if (!taskId) {
      return;
    }

    const source = new EventSource(`/api/generate/status?taskId=${taskId}`);

    source.addEventListener("status", (event) => {
      onStatusRef.current(JSON.parse((event as MessageEvent).data) as GenerationStatusEvent);
    });

    source.addEventListener("result", (event) => {
      onStatusRef.current(JSON.parse((event as MessageEvent).data) as GenerationStatusEvent);
      source.close();
    });

    source.addEventListener("error", (event) => {
      if (event instanceof MessageEvent && event.data) {
        onStatusRef.current(JSON.parse(event.data) as GenerationStatusEvent);
      }
      source.close();
    });

    source.onerror = () => {
      source.close();
    };

    return () => {
      source.close();
    };
  }, [taskId]);
}
