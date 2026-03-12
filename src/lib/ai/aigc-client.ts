import { getModelConfig } from "@/lib/models";
import type { GenerationModel } from "@/types/generation";

const KIE_BASE_URL = process.env.KIE_API_BASE_URL || "https://api.kie.ai";
const KIE_UPLOAD_BASE_URL = process.env.KIE_UPLOAD_BASE_URL || "https://kieai.redpandaai.co";
const POLL_INTERVAL_MS = 2_000;
const MAX_POLL_ATTEMPTS = 90;

export interface ImageGenerationInput {
  model: GenerationModel;
  prompt: string;
  negativePrompt?: string;
  imageCount: number;
  size: { width: number; height: number };
  referenceImages?: Record<string, string>;
  onStatus?: (message: string) => void;
}

export interface ImageGenerationResult {
  id: string;
  url: string;
  width: number;
  height: number;
}

interface KieApiResponse<T> {
  code: number;
  msg: string;
  data: T | null;
}

interface KieCreateTaskData {
  taskId: string;
  recordId?: string;
}

interface KieRecordInfoData {
  taskId: string;
  model: string;
  state: "waiting" | "queuing" | "generating" | "success" | "fail";
  resultJson: string;
  failCode: string | null;
  failMsg: string | null;
  costTime: number | null;
}

interface KieUploadData {
  downloadUrl: string;
}

export async function generateImages(
  input: ImageGenerationInput,
): Promise<ImageGenerationResult[]> {
  const config = getModelConfig(input.model);
  const apiKey = process.env[config.apiKeyEnv];

  if (!apiKey) {
    throw new Error(`Missing API key: ${config.apiKeyEnv}`);
  }

  const prompt = input.negativePrompt
    ? `${input.prompt}\n\nAvoid these traits: ${input.negativePrompt}`
    : input.prompt;

  const uploadedReferenceImages = config.supportsReferenceImages
    ? await uploadReferenceImages(input.referenceImages ?? {}, apiKey)
    : [];

  const taskPayload = {
    model: config.providerModel,
    input: {
      prompt,
      aspect_ratio: toKieAspectRatio(input.size),
      output_format: "jpg",
      ...(config.resolution ? { resolution: config.resolution } : {}),
      ...(config.quality ? { quality: config.quality } : {}),
      ...(uploadedReferenceImages.length > 0 ? { image_input: uploadedReferenceImages } : {}),
    },
  };
  const taskIds: string[] = [];

  for (let index = 0; index < input.imageCount; index += 1) {
    const created = await createKieTask(taskPayload, apiKey);
    taskIds.push(created.taskId);
  }

  input.onStatus?.(
    taskIds.length > 1
      ? `已提交 ${taskIds.length} 个任务，等待队列响应...`
      : "任务已提交，等待队列响应...",
  );

  const messagesByState: Record<KieRecordInfoData["state"], string> = {
    waiting: "任务已接收，等待进入执行队列...",
    queuing: "正在排队分配资源...",
    generating: "正在生成图片...",
    success: "图片结果已返回",
    fail: "任务返回了失败状态",
  };
  const outputs: ImageGenerationResult[] = [];

  for (let index = 0; index < taskIds.length; index += 1) {
    const taskId = taskIds[index];
    let completed = false;

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
      const record = await getKieTaskRecord(taskId, apiKey);
      const prefix = taskIds.length > 1 ? `第 ${index + 1}/${taskIds.length} 张 · ` : "";
      input.onStatus?.(`${prefix}${messagesByState[record.state]}`);

      if (record.state === "success") {
        const resultJson = safeParseJson<{ resultUrls?: string[] }>(record.resultJson);
        const resultUrl = resultJson?.resultUrls?.[0];

        if (!resultUrl) {
          throw new Error("任务完成但没有返回图片结果");
        }

        outputs.push({
          id: `${input.model}-${taskId}-${index}`,
          url: resultUrl,
          width: input.size.width,
          height: input.size.height,
        });
        completed = true;
        break;
      }

      if (record.state === "fail") {
        const reason = [record.failCode, record.failMsg].filter(Boolean).join(" · ");
        throw new Error(`生成失败${reason ? `: ${reason}` : ""}`);
      }

      await wait(POLL_INTERVAL_MS);
    }

    if (!completed) {
      throw new Error("生成超时，请稍后重试");
    }
  }

  if (outputs.length === 0) {
    throw new Error("没有返回任何图片结果");
  }

  return outputs;
}

async function createKieTask(payload: Record<string, unknown>, apiKey: string) {
  const response = await fetch(`${KIE_BASE_URL}/api/v1/jobs/createTask`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json()) as KieApiResponse<KieCreateTaskData>;
  if (!response.ok || result.code !== 200 || !result.data?.taskId) {
    throw new Error(`创建任务失败: ${result.msg || "Unknown error"}`);
  }

  return result.data;
}

async function getKieTaskRecord(taskId: string, apiKey: string) {
  const response = await fetch(
    `${KIE_BASE_URL}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );

  const result = (await response.json()) as KieApiResponse<KieRecordInfoData>;
  if (!response.ok || result.code !== 200 || !result.data) {
    throw new Error(`查询任务失败: ${result.msg || "Unknown error"}`);
  }

  return result.data;
}

async function uploadReferenceImages(referenceImages: Record<string, string>, apiKey: string) {
  const uploads = await Promise.all(
    Object.entries(referenceImages).map(async ([imageId, dataUrl], index) => {
      const response = await fetch(`${KIE_UPLOAD_BASE_URL}/api/file-base64-upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "Munch/1.0",
        },
        body: JSON.stringify({
          base64Data: dataUrl,
          uploadPath: "images/munch-reference",
          fileName: `${imageId || "reference"}-${Date.now()}-${index}.png`,
        }),
      });

      const result = (await response.json()) as {
        code?: number;
        msg?: string;
        data?: KieUploadData | null;
      };

      if (!response.ok || result.code !== 200 || !result.data?.downloadUrl) {
        throw new Error(`参考图上传失败: ${result.msg || "Unknown error"}`);
      }

      return result.data.downloadUrl;
    }),
  );

  return uploads;
}

function toKieAspectRatio(size: { width: number; height: number }) {
  const inputRatio = size.width / size.height;
  const supportedRatios = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];

  let closestRatio = supportedRatios[0];
  let smallestDistance = Number.POSITIVE_INFINITY;

  for (const ratio of supportedRatios) {
    const [width, height] = ratio.split(":").map(Number);
    const ratioValue = width / height;
    const distance = Math.abs(inputRatio - ratioValue);

    if (distance < smallestDistance) {
      smallestDistance = distance;
      closestRatio = ratio;
    }
  }

  return closestRatio;
}

function safeParseJson<T>(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
