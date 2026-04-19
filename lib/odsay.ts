import { OdsayErrorEntry, OdsayTransitResponse, TransitErrorSource } from "@/types/odsay";

const ODSAY_API_BASE_URL = "https://api.odsay.com/v1/api/searchPubTransPathT";

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

function getOdsayErrorEntry(error: OdsayTransitResponse["error"]): OdsayErrorEntry | undefined {
  if (!error) {
    return undefined;
  }

  return Array.isArray(error) ? error[0] : error;
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
  ey: string
): Promise<OdsayTransitResponse> {
  const apiKey = process.env.ODSAY_API_KEY;
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

  try {
    const url = `${ODSAY_API_BASE_URL}?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      // 실시간 교통 정보 또는 다중 조회 시 캐시가 혼선을 줄 수 있으므로 무효화
      cache: "no-store", 
      headers: {
        // Vercel 동적 IP 에러 방지 트릭: 
        // ODsay 웹(Web) 키를 서버에서 사용할 수 있도록 브라우저인 것처럼 Referer를 속입니다.
        "Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "Origin": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      }
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
