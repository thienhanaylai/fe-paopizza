const GOONG_REST_URL = "https://rsapi.goong.io";

const restApgoongRestApiKeyiKey = process.env.NEXT_PUBLIC_GOONG_REST_API_KEY;

const requestGoong = async (pathname, params) => {
  if (!restApgoongRestApiKeyiKey) {
    const error = new Error("GOONG_REST_API_KEY_NOT_CONFIGURED");
    error.statusCode = 503;
    throw error;
  }

  const url = new URL(pathname, GOONG_REST_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  url.searchParams.set("api_key", restApgoongRestApiKeyiKey);

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload || payload.status !== "OK") {
    const error = new Error("GOONG_API_ERROR");
    error.statusCode = 502;
    throw error;
  }
  return payload;
};

export const autocomplete = async ({
  input,
  location,
  sessiontoken,
  limit = 8,
}: {
  input: string;
  location?: string;
  sessiontoken: string;
  limit?: number;
}) => {
  if (!input || String(input).trim().length < 2) {
    throw new Error("INVALID_SEARCH_INPUT");
  }

  return requestGoong("/Place/AutoComplete", {
    input: String(input).trim(),
    location,
    sessiontoken,
    limit: Math.min(Math.max(Number(limit) || 8, 1), 10),
    more_compound: true,
  });
};

export const placeDetail = async ({ place_id, sessiontoken }) => {
  if (!place_id) throw new Error("MISSING_PLACE_ID");
  return requestGoong("/Place/Detail", { place_id, sessiontoken });
};
