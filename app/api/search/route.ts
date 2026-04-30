import { NextRequest, NextResponse } from "next/server";
import { searchPlaces } from "@/lib/kakao";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json(
      { error: "검색어(q)가 필요합니다." },
      { status: 400 }
    );
  }

  const result = await searchPlaces(query);

  if (!result) {
    return NextResponse.json(
      { error: "카카오 API 연동 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json(result);
}
