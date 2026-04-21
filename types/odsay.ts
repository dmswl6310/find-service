export interface OdsayPathInfo {
  totalTime: number;         // 총 소요 시간 (분)
  payment: number;           // 총 요금 (원)
  firstStartStation: string; // 출발 정류장/역
  lastEndStation: string;    // 도착 정류장/역
  transitCount: number;      // 환승 횟수
  mapObj?: string;           // 그래픽 데이터 노선 조회를 위한 키값
}

export interface OdsayLane {
  name?: string;     // 지하철 노선명 (예: "지하철2호선")
  busNo?: string;    // 버스 번호 (예: "721")
  type?: number;     // 버스 타입
  subwayCode?: number; // 지하철 코드
}

export interface OdsayPassStopStation {
  index?: number;
  stationID?: number;
  stationName?: string;
  x: string | number;
  y: string | number;
}

export interface OdsayPassStopList {
  stations?: OdsayPassStopStation[];
}

export interface OdsaySubPath {
  trafficType: number; // 1:지하철, 2:버스, 3:도보
  distance: number;
  sectionTime: number;
  stationCount?: number;
  lane?: OdsayLane[];
  startName?: string;
  endName?: string;
  startX?: string | number;
  startY?: string | number;
  endX?: string | number;
  endY?: string | number;
  passStopList?: OdsayPassStopList;
}

export interface OdsayPath {
  pathType: number;          // 1:지하철, 2:버스, 3:버스+지하철
  info: OdsayPathInfo;
  subPath: OdsaySubPath[];
}

export interface OdsayErrorEntry {
  code: string;
  msg?: string;
  message?: string;
}

export interface OdsayTransitResponse {
  result?: {
    path?: OdsayPath[];
  };
  error?: OdsayErrorEntry | OdsayErrorEntry[];
}

export interface OdsayGraphicPosition {
  x: string | number;
  y: string | number;
}

export interface OdsayGraphicSection {
  graphPos?: OdsayGraphicPosition[];
}

export interface OdsayGraphicLane {
  section?: OdsayGraphicSection[];
}

export interface OdsayGraphicResponse {
  result?: {
    lane?: OdsayGraphicLane[];
  };
  error?: OdsayErrorEntry | OdsayErrorEntry[];
}

export type TransitErrorSource = "client" | "server" | "odsay" | "route";

export interface TransitApiErrorPayload {
  error: string;
  errorCode?: string;
  errorStatus?: number;
  errorSource?: TransitErrorSource;
  errorDetails?: string;
}

export interface TransitFetchResult {
  fromId: string;
  toId: string;
  timeMn: number;
  payment: number;
  pathType: number;
  transitCount?: number;
  subPath?: OdsaySubPath[];
  mapObj?: string;
  error?: boolean;
  errorMessage?: string;
  errorCode?: string;
  errorStatus?: number;
  errorSource?: TransitErrorSource;
  errorDetails?: string;
}
