import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuthenticatedUser } from "@/lib/auth";
import { toErrorResponse } from "@/lib/errors";
import { isGenerationModel, normalizeGenerationModel } from "@/lib/models";
import { createGenerationTask } from "@/lib/mock-service";

const generateSchema = z.object({
  templateId: z.string().optional(),
  prompt: z.string().trim().max(4000).optional(),
  model: z.string().refine(isGenerationModel),
  imageCount: z.number().int().min(1).max(4),
  variables: z.record(z.string()).default({}),
  referenceImages: z.record(z.string()).optional(),
  customPrompt: z.string().trim().max(600).optional(),
  thinkingEnabled: z.boolean().optional(),
  aspectRatio: z.string().regex(/^\d+:\d+$/).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const json = await request.json();
    const parsed = generateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "INVALID_REQUEST",
          message: "请求参数不合法",
        },
        { status: 400 },
      );
    }

    if (!parsed.data.templateId && !parsed.data.prompt?.trim()) {
      return NextResponse.json(
        {
          error: "INVALID_REQUEST",
          message: "请选择模板或输入提示词",
        },
        { status: 400 },
      );
    }

    const payload = {
      ...parsed.data,
      model: normalizeGenerationModel(parsed.data.model),
      imageCount: parsed.data.imageCount as 1 | 2 | 3 | 4,
    };

    const result = await createGenerationTask(user, payload);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "发起任务失败");
  }
}
