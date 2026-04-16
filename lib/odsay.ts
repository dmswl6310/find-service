import { OdsayTransitResponse } from "@/types/odsay";

const ODSAY_API_BASE_URL = "https://api.odsay.com/v1/api/searchPubTransPathT";

export async function fetchTransitRoute(
  sx: string,
  sy: string,
  ex: string,
  ey: string
): Promise<OdsayTransitResponse | null> {
  const apiKey = process.env.ODSAY_API_KEY;
  if (!apiKey) {
    console.error("ODSAY_API_KEY is not set");
    return null;
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
    });

    if (!response.ok) {
      console.error("ODsay API Error:", await response.text());
      return null;
    }

    const data: OdsayTransitResponse = await response.json();
    return data;
  } catch (error) {
    console.error("ODsay API Request Failed:", error);
    return null;
  }
}
