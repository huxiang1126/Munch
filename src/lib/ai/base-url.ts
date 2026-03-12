const DEFAULT_ROOT_URL = "https://aigcapi.top";
const DEFAULT_BASE_URL = `${DEFAULT_ROOT_URL}/v1`;
const DEFAULT_KIE_LLM_BASE_URL = "https://api.kie.ai/gpt-5-2/v1";

export function getAigcBaseUrl() {
  const configured = process.env.AIGC_API_BASE_URL?.trim();
  if (!configured) {
    return DEFAULT_BASE_URL;
  }

  const normalized = configured.replace(/\/+$/, "");
  return normalized.endsWith("/v1") ? normalized : `${normalized}/v1`;
}

export function getAigcRootUrl() {
  return getAigcBaseUrl().replace(/\/v1$/, "");
}

export function getKieLlmBaseUrl() {
  const configured = process.env.KIE_LLM_BASE_URL?.trim();
  if (!configured) {
    return DEFAULT_KIE_LLM_BASE_URL;
  }

  return configured.replace(/\/+$/, "");
}
