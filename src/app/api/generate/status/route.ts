import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth";
import { toErrorResponse } from "@/lib/errors";
import { getTaskEvents } from "@/lib/mock-service";

const encoder = new TextEncoder();

function event(name: string, data: Record<string, unknown>) {
  return encoder.encode(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const taskId = new URL(request.url).searchParams.get("taskId");
    if (!taskId) {
      return NextResponse.json(
        {
          error: "MISSING_TASK_ID",
          message: "缺少 taskId 参数",
        },
        { status: 400 },
      );
    }

    let interval: NodeJS.Timeout | undefined;
    let timeout: NodeJS.Timeout | undefined;
    let lastSeq = 0;

    const stream = new ReadableStream({
      start(controller) {
        let closed = false;

        const closeStream = () => {
          if (closed) {
            return;
          }
          closed = true;
          clearInterval(interval);
          clearTimeout(timeout);
          controller.close();
        };

        const pushUpdates = () => {
          try {
            const updates = getTaskEvents(user.id, taskId, lastSeq);
            for (const update of updates) {
              lastSeq = update.seq;
              controller.enqueue(
                event(update.kind, {
                  status: update.status,
                  message: update.message,
                  progress: update.progress,
                  images: update.images,
                  compiledPrompt: update.compiledPrompt,
                }),
              );

              if (update.kind === "result" || update.kind === "error") {
                closeStream();
                return;
              }
            }
          } catch (error) {
            controller.enqueue(
              event("error", {
                status: "failed",
                message: error instanceof Error ? error.message : "任务状态获取失败",
              }),
            );
            closeStream();
          }
        };

        pushUpdates();
        interval = setInterval(pushUpdates, 300);
        timeout = setTimeout(closeStream, 120_000);
      },
      cancel() {
        clearInterval(interval);
        clearTimeout(timeout);
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return toErrorResponse(error, "SSE 建立失败");
  }
}
