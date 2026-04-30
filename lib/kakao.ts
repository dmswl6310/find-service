import { getKakaoRestApiKey, KAKAO_LOCAL_SEARCH_URL } from "@/lib/external-config";
import type { KakaoSearchResponse } from "@/types/kakao";

const KAKAO_API_BASE_URL = KAKAO_LOCAL_SEARCH_URL;

function isKakaoSearchResponse(data: unknown): data is KakaoSearchResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "documents" in data &&
    Array.isArray((data as KakaoSearchResponse).documents)
  );
}

export async function searchPlaces(keyword: string): Promise<KakaoSearchResponse | null> {
  const trimmedKeyword = keyword.trim();
  if (!trimmedKeyword) return null;

  const apiKey = getKakaoRestApiKey();
  if (!apiKey) {
    console.error("Kakao REST API key is missing");
    return null;
  }

  try {
    const response = await fetch(`${KAKAO_API_BASE_URL}?query=${encodeURIComponent(trimmedKeyword)}`, {
      method: "GET",
      headers: {
        Authorization: `KakaoAK ${apiKey}`,
      },
      // 서버에서 실시간 검색을 위해 캐시하지 않음
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Kakao API Error:", await response.text());
      return null;
    }

    const data = await response.json();
    if (!isKakaoSearchResponse(data)) {
      console.error("Kakao API returned invalid payload:", data);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Kakao API Request Failed:", error);
    return null;
  }
}
