import { inngest } from "../client";

export const generateImage = inngest.createFunction(
  { id: "generate-image" },
  { event: "munch/generate.requested" },
  async ({ event }) => {
    return {
      status: "queued",
      payload: event.data,
    };
  },
);
