import { NextRequest, NextResponse } from "next/server";
import { TransitApiError, fetchTransitRoute } from "@/lib/odsay";
import { OdsayErrorEntry, OdsayPath, TransitApiErrorPayload, OdsayTransitResponse } from "@/types/odsay";

function getOdsayErrorEntry(error: OdsayTransitResponse["error"]): OdsayErrorEntry | undefined {
  if (!error) {
    return undefined;
  }

  return Array.isArray(error) ? error[0] : error;
}

function getOdsayErrorStatus(code?: string): number {
  switch (code) {
    case "-8":
    case "-9":
      return 400;
    case "3":
    case "4":
    case "5":
    case "6":
    case "-99":
      return 404;
    default:
      return 502;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sx = searchParams.get("sx");
  const sy = searchParams.get("sy");
  const ex = searchParams.get("ex");
  const ey = searchParams.get("ey");
  const date = searchParams.get("date");
  const time = searchParams.get("time");

  if (!sx || !sy || !ex || !ey) {
    return NextResponse.json(
      { error: "출발지 및 목적지 좌표(sx, sy, ex, ey)가 모두 필요합니다." },
      { status: 400 }
    );
  }

  let data;

  try {
    data = await fetchTransitRoute(sx, sy, ex, ey, date || undefined, time || undefined);
  } catch (error) {
    if (error instanceof TransitApiError) {
      const errorPayload: TransitApiErrorPayload = {
        error: error.message,
        errorCode: error.code,
        errorStatus: error.status,
        errorSource: error.source,
        errorDetails: error.details,
      };

      return NextResponse.json(errorPayload, { status: error.status });
    }

    console.error("[transit][route] Unexpected transit route error", {
      sx,
      sy,
      ex,
      ey,
      error,
    });

    return NextResponse.json(
      {
        error: "대중교통 길찾기 API 연동 중 예기치 않은 오류가 발생했습니다.",
        errorStatus: 500,
        errorSource: "route",
      } satisfies TransitApiErrorPayload,
      { status: 500 }
    );
  }

  // ODsay 에러 코드 반환 (ex: 500 "출발지와 도착지가 700m 이내입니다.")
  if (data.error) {
    const errorEntry = getOdsayErrorEntry(data.error);
    const errorStatus = getOdsayErrorStatus(errorEntry?.code);

    // 700m 이내 등 도보 이동 가능 거리일 경우의 에러 코드 대응
    if (errorEntry?.code === "-98") {
      return NextResponse.json({
        totalTime: 0,
        payment: 0,
        transitCount: 0,
        pathType: 0,
        walkOnly: true,
      });
    }

    console.error("[transit][route] ODsay route lookup failed", {
      sx,
      sy,
      ex,
      ey,
      code: errorEntry?.code,
      message: errorEntry?.msg || errorEntry?.message,
    });

    return NextResponse.json(
      {
        error: errorEntry?.msg || errorEntry?.message || "길찾기 결과를 찾을 수 없습니다.",
        errorCode: errorEntry?.code,
        errorStatus: errorStatus,
        errorSource: "odsay",
      } satisfies TransitApiErrorPayload,
      { status: errorStatus }
    );
  }

  // 경로 결과가 있는 경우 최단 시간 1순위 경로 리턴
  const paths: OdsayPath[] = data.result?.path || [];
  if (paths.length === 0) {
    console.error("[transit][route] No route found", {
      sx,
      sy,
      ex,
      ey,
    });

    return NextResponse.json(
      {
        error: "이용 가능한 대중교통 경로가 없습니다.",
        errorStatus: 404,
        errorSource: "odsay",
      } satisfies TransitApiErrorPayload,
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
    subPath: bestPath.subPath,
    mapObj: bestPath.info.mapObj,
  });
}
