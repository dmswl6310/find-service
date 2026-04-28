import { OdsayTransitResponse, TransitErrorSource } from "@/types/odsay";
import { getAppOriginHeaders, getOdsayApiKey, ODSAY_SEARCH_TRANSIT_PATH_URL } from "@/lib/external-config";
import { getOdsayErrorEntry } from "@/lib/odsay-error";

const ODSAY_API_BASE_URL = ODSAY_SEARCH_TRANSIT_PATH_URL;

export class TransitApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly source: TransitErrorSource,
    public readonly code?: string,
    public readonly details?: string
  ) {
    super(message);
    this.name = "TransitApiError";
  }
}

function parseErrorPayload(rawText: string): { code?: string; message?: string } {
  if (!rawText) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawText) as OdsayTransitResponse;
    const errorEntry = getOdsayErrorEntry(parsed.error);

    return {
      code: errorEntry?.code,
      message: errorEntry?.msg || errorEntry?.message,
    };
  } catch {
    return {};
  }
}

export async function fetchTransitRoute(
  sx: string,
  sy: string,
  ex: string,
  ey: string,
  date?: string,
  time?: string
): Promise<OdsayTransitResponse> {
  const apiKey = getOdsayApiKey();
  if (!apiKey) {
    console.error("[transit][odsay] Missing ODSAY_API_KEY", {
      sx,
      sy,
      ex,
      ey,
    });
    throw new TransitApiError("ODSAY_API_KEY is not set", 500, "server");
  }

  // ODsay API 요구사항에 맞춰 query param 설정 (API 키는 URL 인코딩 필요)
  const queryParams = new URLSearchParams({
    SX: sx,
    SY: sy,
    EX: ex,
    EY: ey,
    apiKey: apiKey, 
  });
  
  if (date) queryParams.set("date", date);
  if (time) queryParams.set("time", time);

  try {
    const url = `${ODSAY_API_BASE_URL}?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      // 실시간 교통 정보 또는 다중 조회 시 캐시가 혼선을 줄 수 있으므로 무효화
      cache: "no-store", 
      headers: getAppOriginHeaders(),
    });

    if (!response.ok) {
      const rawText = await response.text();
      const { code, message } = parseErrorPayload(rawText);

      console.error("[transit][odsay] Upstream API error", {
        status: response.status,
        code,
        message: message || "ODsay API request failed",
        sx,
        sy,
        ex,
        ey,
        details: rawText,
      });

      throw new TransitApiError(
        message || "ODsay API request failed",
        response.status || 502,
        code ? "odsay" : "server",
        code,
        rawText
      );
    }

    const data: OdsayTransitResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof TransitApiError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown transit request error";
    console.error("[transit][odsay] Request failed", {
      sx,
      sy,
      ex,
      ey,
      message,
      error,
    });
    throw new TransitApiError(message, 502, "server");
  }
}
