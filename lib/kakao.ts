import { getKakaoRestApiKey, KAKAO_LOCAL_CATEGORY_URL, KAKAO_LOCAL_SEARCH_URL } from "@/lib/external-config";
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

// 카카오 카테고리 코드: SW8 = 지하철역
const SUBWAY_CATEGORY_CODE = "SW8";
// 카카오 카테고리 검색의 페이지당 최대 결과 수
export const KAKAO_CATEGORY_PAGE_SIZE = 15;

export interface SubwayStationQuery {
  x: number;
  y: number;
  radius: number; // 미터, 카카오 최대 20000
  page?: number;
}

export async function searchSubwayStations({
  x,
  y,
  radius,
  page = 1,
}: SubwayStationQuery): Promise<KakaoSearchResponse | null> {
  const apiKey = getKakaoRestApiKey();
  if (!apiKey) {
    console.error("Kakao REST API key is missing");
    return null;
  }

  const params = new URLSearchParams({
    category_group_code: SUBWAY_CATEGORY_CODE,
    x: String(x),
    y: String(y),
    radius: String(radius),
    sort: "distance",
    size: String(KAKAO_CATEGORY_PAGE_SIZE),
    page: String(page),
  });

  try {
    const response = await fetch(`${KAKAO_LOCAL_CATEGORY_URL}?${params}`, {
      method: "GET",
      headers: {
        Authorization: `KakaoAK ${apiKey}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Kakao Category API Error:", await response.text());
      return null;
    }

    const data = await response.json();
    if (!isKakaoSearchResponse(data)) {
      console.error("Kakao Category API returned invalid payload:", data);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Kakao Category API Request Failed:", error);
    return null;
  }
}
