export interface OdsayPathInfo {
  totalTime: number;         // 총 소요 시간 (분)
  payment: number;           // 총 요금 (원)
  firstStartStation: string; // 출발 정류장/역
  lastEndStation: string;    // 도착 정류장/역
  transitCount: number;      // 환승 횟수
}

export interface OdsayPath {
  pathType: number;          // 1:지하철, 2:버스, 3:버스+지하철
  info: OdsayPathInfo;
}

export interface OdsayTransitResponse {
  result?: {
    path?: OdsayPath[];
  };
  error?: {
    msg: string;
    code: string;
  };
}

export interface TransitFetchResult {
  fromId: string;
  toId: string;
  timeMn: number;
  payment: number;
  pathType: number;
  error?: boolean;
}
