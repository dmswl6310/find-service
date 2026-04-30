export const KAKAO_MAP_SDK_URL = "//dapi.kakao.com/v2/maps/sdk.js";
export const KAKAO_LOCAL_SEARCH_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";

export const ODSAY_SEARCH_TRANSIT_PATH_URL = "https://api.odsay.com/v1/api/searchPubTransPathT";
export const ODSAY_LOAD_LANE_URL = "https://api.odsay.com/v1/api/loadLane";

export const LOCALHOST_APP_URL = "http://localhost:3000";

export function getKakaoJsApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_KAKAO_JS_API_KEY;
}

export function getKakaoRestApiKey(): string | undefined {
  return process.env.KAKAO_REST_API_KEY;
}

export function getOdsayApiKey(): string | undefined {
  return process.env.ODSAY_API_KEY;
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || LOCALHOST_APP_URL;
}

export function getAppOriginHeaders(): { Referer: string; Origin: string } {
  const appUrl = getAppUrl();

  return {
    Referer: appUrl,
    Origin: appUrl,
  };
}

export function buildKakaoSdkScriptUrl(appKey: string | undefined): string {
  if (!appKey) {
    console.error("NEXT_PUBLIC_KAKAO_JS_API_KEY is missing");
  }

  return `${KAKAO_MAP_SDK_URL}?appkey=${appKey}&autoload=false&libraries=services,clusterer,drawing`;
}
