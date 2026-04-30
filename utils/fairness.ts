import type { KakaoLocation } from "@/types/kakao";
import type { TransitFetchResult } from "@/types/odsay";

export function getFairestEndId(
  starts: KakaoLocation[],
  ends: KakaoLocation[],
  matrixData: TransitFetchResult[]
) {
  if (starts.length < 2 || ends.length < 2 || matrixData.length === 0) return null;

  const scores = ends.map((end) => {
    const colResults = matrixData.filter((result) => result.toId === end.id && !result.error && result.timeMn >= 0);
    if (colResults.length !== starts.length) return { id: end.id, score: Infinity };

    const times = colResults.map((result) => result.timeMn);
    const max = Math.max(...times);
    const avg = times.reduce((sum, value) => sum + value, 0) / times.length;

    return { id: end.id, score: max + avg };
  });

  const validScores = scores.filter((score) => score.score !== Infinity);
  if (validScores.length === 0) return null;

  const minScore = Math.min(...validScores.map((score) => score.score));
  return validScores.find((score) => score.score === minScore)?.id ?? null;
}
