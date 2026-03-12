import { NextResponse } from "next/server";

import { getTemplateRecordById } from "@/lib/template-source";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = await getTemplateRecordById(id);

  if (!template) {
    return NextResponse.json(
      {
        error: "TEMPLATE_NOT_FOUND",
        message: "模板不存在",
      },
      { status: 404 },
    );
  }

  return NextResponse.json(template);
}
