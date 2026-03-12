import { NextResponse } from "next/server";

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function toErrorResponse(error: unknown, fallbackMessage = "服务暂时不可用") {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.code,
        message: error.message,
      },
      { status: error.status },
    );
  }

  console.error(error);

  return NextResponse.json(
    {
      error: "INTERNAL_SERVER_ERROR",
      message: fallbackMessage,
    },
    { status: 500 },
  );
}
