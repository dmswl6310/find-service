import { NextRequest, NextResponse } from "next/server";
import { OdsayGraphicResponse } from "@/types/odsay";
import { getOdsayErrorEntry, normalizeOdsayErrorPayload } from "@/lib/odsay-error";
import { getAppOriginHeaders, getOdsayApiKey, ODSAY_LOAD_LANE_URL } from "@/lib/external-config";

function normalizeMapObject(mapObj: string) {
  const [firstSegment] = mapObj.split("@");
  const isAlreadyPrefixed = firstSegment.split(":").length === 2;

  return isAlreadyPrefixed ? mapObj : `0:0@${mapObj}`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mapObj = searchParams.get("mapObj");

  if (!mapObj) {
    return NextResponse.json({ error: "mapObj 파라미터가 필요합니다." }, { status: 400 });
  }

  const apiKey = getOdsayApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });
  }

  const normalizedMapObject = normalizeMapObject(mapObj);
  const url = `${ODSAY_LOAD_LANE_URL}?mapObject=${encodeURIComponent(normalizedMapObject)}&apiKey=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      // 실시간 통신이나 빠른 반영을 위해 no-store
      cache: "no-store",
      headers: getAppOriginHeaders(),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "그래픽 노선 조회 실패" }, { status: response.status });
    }

    const data: OdsayGraphicResponse = await response.json();

    const errorEntry = getOdsayErrorEntry(data.error);
    if (errorEntry) {
      return NextResponse.json(normalizeOdsayErrorPayload(data.error, "그래픽 노선 조회 실패"), { status: 502 });
    }

    const lanes = Array.isArray(data.result?.lane) ? data.result.lane : [];
    if (lanes.length === 0) {
      return NextResponse.json({ error: "그래픽 노선 데이터가 비어 있습니다." }, { status: 502 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Graphic load error:", error);
    return NextResponse.json({ error: "요청 실패" }, { status: 500 });
  }
}
