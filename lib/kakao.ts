import { KakaoSearchResponse } from "@/types/kakao";

const KAKAO_API_BASE_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";

export async function searchPlaces(keyword: string): Promise<KakaoSearchResponse | null> {
  if (!keyword) return null;

  try {
    const response = await fetch(`${KAKAO_API_BASE_URL}?query=${encodeURIComponent(keyword)}`, {
      method: "GET",
      headers: {
        Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
      },
      // 서버에서 실시간 검색을 위해 캐시하지 않음
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Kakao API Error:", await response.text());
      return null;
    }

    const data: KakaoSearchResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Kakao API Request Failed:", error);
    return null;
  }
}
