import type { KakaoLocation } from "@/types/kakao";
import type { TransitFetchResult } from "@/types/odsay";
import { getFairestEndId } from "@/utils/fairness";

export type CandidateSummary = {
  id: string;
  name: string;
  averageMinutes: number | null;
  maxMinutes: number | null;
  score: number | null;
  isComplete: boolean;
  isFairest: boolean;
  validRoutes: number;
  totalRoutes: number;
  originalIndex: number;
};

export function findRouteResult(matrixData: TransitFetchResult[], fromId: string, toId: string) {
  return matrixData.find((result) => result.fromId === fromId && result.toId === toId);
}

export function buildCandidateSummaries(
  starts: KakaoLocation[],
  ends: KakaoLocation[],
  matrixData: TransitFetchResult[]
): CandidateSummary[] {
  const fairestEndId = getFairestEndId(starts, ends, matrixData);
  return ends
    .map((end, originalIndex) => {
      const results = starts
        .map((start) => findRouteResult(matrixData, start.id, end.id))
        .filter((result): result is TransitFetchResult => Boolean(result));
      const valid = results.filter((result) => !result.error && result.timeMn >= 0);
      const isComplete = starts.length > 0 && valid.length === starts.length;
      const times = valid.map((result) => result.timeMn);
      const averageMinutes = isComplete ? times.reduce((sum, time) => sum + time, 0) / times.length : null;
      const maxMinutes = isComplete ? Math.max(...times) : null;
      return {
        id: end.id,
        name: end.place_name,
        averageMinutes,
        maxMinutes,
        score: averageMinutes !== null && maxMinutes !== null ? averageMinutes + maxMinutes : null,
        isComplete,
        isFairest: end.id === fairestEndId,
        validRoutes: valid.length,
        totalRoutes: starts.length,
        originalIndex,
      };
    })
    .sort((left, right) => {
      if (left.score === null && right.score === null) return left.originalIndex - right.originalIndex;
      if (left.score === null) return 1;
      if (right.score === null) return -1;
      return left.score - right.score || left.originalIndex - right.originalIndex;
    });
}
