import { OdsaySubPath, TransitApiErrorPayload, TransitErrorSource, TransitFetchResult } from "@/types/odsay";

interface TransitApiSuccessPayload {
  totalTime?: number;
  payment?: number;
  pathType?: number;
  transitCount?: number;
  subPath?: OdsaySubPath[];
  walkOnly?: boolean;
  mapObj?: string;
}

export type TransitApiParseOutcomeType = "http-error" | "invalid-success-payload" | "success";

export interface TransitApiParseOutcome {
  type: TransitApiParseOutcomeType;
  result: TransitFetchResult;
}

function isTransitApiErrorPayload(data: unknown): data is TransitApiErrorPayload {
  return typeof data === "object" && data !== null && "error" in data;
}

function isTransitApiSuccessPayload(data: unknown): data is TransitApiSuccessPayload {
  return typeof data === "object" && data !== null;
}

function createErrorResult(params: {
  fromId: string;
  toId: string;
  errorMessage: string;
  errorCode?: string;
  errorStatus?: number;
  errorSource?: TransitErrorSource;
  errorDetails?: string;
}): TransitFetchResult {
  return {
    fromId: params.fromId,
    toId: params.toId,
    timeMn: -1,
    payment: 0,
    pathType: 0,
    error: true,
    errorMessage: params.errorMessage,
    errorCode: params.errorCode,
    errorStatus: params.errorStatus,
    errorSource: params.errorSource,
    errorDetails: params.errorDetails,
  };
}

export function parseTransitApiResult(params: {
  fromId: string;
  toId: string;
  response: Response;
  data: unknown;
}): TransitApiParseOutcome {
  const { fromId, toId, response, data } = params;

  if (!response.ok) {
    const errorPayload = isTransitApiErrorPayload(data) ? data : null;

    return {
      type: "http-error",
      result: createErrorResult({
        fromId,
        toId,
        errorMessage: errorPayload?.error || "조회 실패",
        errorCode: errorPayload?.errorCode,
        errorStatus: errorPayload?.errorStatus ?? response.status,
        errorSource: errorPayload?.errorSource,
        errorDetails: errorPayload?.errorDetails,
      }),
    };
  }

  if (!isTransitApiSuccessPayload(data)) {
    return {
      type: "invalid-success-payload",
      result: createErrorResult({
        fromId,
        toId,
        errorMessage: "응답 형식이 올바르지 않습니다.",
        errorSource: "route",
      }),
    };
  }

  if (data.walkOnly) {
    return {
      type: "success",
      result: {
        fromId,
        toId,
        timeMn: 0,
        payment: 0,
        pathType: 0,
        transitCount: 0,
        subPath: [],
      },
    };
  }

  return {
    type: "success",
    result: {
      fromId,
      toId,
      timeMn: data.totalTime || -1,
      payment: data.payment || 0,
      pathType: data.pathType || 0,
      transitCount: data.transitCount || 0,
      subPath: data.subPath || [],
      mapObj: data.mapObj,
    },
  };
}

export function createTransitClientExceptionResult(params: {
  fromId: string;
  toId: string;
  caughtError: unknown;
}): TransitFetchResult {
  const { fromId, toId, caughtError } = params;

  return createErrorResult({
    fromId,
    toId,
    errorMessage:
      caughtError instanceof Error ? caughtError.message : "경로 조회 중 요청 오류가 발생했습니다.",
    errorSource: "client",
  });
}
