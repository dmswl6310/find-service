import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mapObj = searchParams.get("mapObj");

  if (!mapObj) {
    return NextResponse.json({ error: "mapObj 파라미터가 필요합니다." }, { status: 400 });
  }

  const apiKey = process.env.ODSAY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });
  }

  const url = `https://api.odsay.com/v1/api/loadLane?mapObject=${mapObj}&apiKey=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      // 실시간 통신이나 빠른 반영을 위해 no-store
      cache: "no-store",
      headers: {
        "Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "Origin": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: "그래픽 노선 조회 실패" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Graphic load error:", error);
    return NextResponse.json({ error: "요청 실패" }, { status: 500 });
  }
}
