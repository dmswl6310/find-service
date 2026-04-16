import { NextRequest, NextResponse } from "next/server";
import { fetchTransitRoute } from "@/lib/odsay";
import { OdsayPath } from "@/types/odsay";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sx = searchParams.get("sx");
  const sy = searchParams.get("sy");
  const ex = searchParams.get("ex");
  const ey = searchParams.get("ey");

  if (!sx || !sy || !ex || !ey) {
    return NextResponse.json(
      { error: "출발지 및 목적지 좌표(sx, sy, ex, ey)가 모두 필요합니다." },
      { status: 400 }
    );
  }

  const data = await fetchTransitRoute(sx, sy, ex, ey);

  if (!data) {
    return NextResponse.json(
      { error: "대중교통 길찾기 API 연동 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  // ODsay 에러 코드 반환 (ex: 500 "출발지와 도착지가 700m 이내입니다.")
  if (data.error) {
    // 700m 이내 등 도보 이동 가능 거리일 경우의 에러 코드 대응
    if (data.error.code === "-98") {
      return NextResponse.json({
        totalTime: 0,
        payment: 0,
        transitCount: 0,
        pathType: 0,
        walkOnly: true,
      });
    }
    return NextResponse.json(
      { error: data.error.msg || "길찾기 결과를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 경로 결과가 있는 경우 최단 시간 1순위 경로 리턴
  const paths: OdsayPath[] = data.result?.path || [];
  if (paths.length === 0) {
    return NextResponse.json(
      { error: "이용 가능한 대중교통 경로가 없습니다." },
      { status: 404 }
    );
  }

  // 첫 번째 추천 경로 반환 (보통 최단/최적 순)
  const bestPath = paths[0];

  return NextResponse.json({
    totalTime: bestPath.info.totalTime,
    payment: bestPath.info.payment,
    transitCount: bestPath.info.transitCount,
    pathType: bestPath.pathType,
  });
}
