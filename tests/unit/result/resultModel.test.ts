import { buildCandidateSummaries, findRouteResult } from "@/components/result/resultModel";
import { makeFailedRoute, makeLocation, makeRoute } from "@/tests/fixtures/transit";

describe("buildCandidateSummaries 후보 요약", () => {
  const starts = [makeLocation("s1", "홍대"), makeLocation("s2", "잠실")];
  const ends = [makeLocation("e1", "을지로"), makeLocation("e2", "성수")];

  it("완전한 후보를 최장 시간과 평균의 합으로 정렬하고 황금 밸런스를 표시한다", () => {
    const matrix = [
      makeRoute("s1", "e1", 30), makeRoute("s2", "e1", 50),
      makeRoute("s1", "e2", 20), makeRoute("s2", "e2", 70),
    ];
    const summaries = buildCandidateSummaries(starts, ends, matrix);

    expect(summaries.map((item) => item.id)).toEqual(["e1", "e2"]);
    expect(summaries[0]).toMatchObject({ averageMinutes: 40, maxMinutes: 50, score: 90, isFairest: true });
  });

  it("성공한 셀을 숨기지 않으면서 불완전한 후보를 완전한 후보 뒤에 둔다", () => {
    const matrix = [
      makeRoute("s1", "e1", 30), makeRoute("s2", "e1", 50),
      makeRoute("s1", "e2", 20), makeFailedRoute("s2", "e2"),
    ];
    const summaries = buildCandidateSummaries(starts, ends, matrix);

    expect(summaries[1]).toMatchObject({ id: "e2", isComplete: false, validRoutes: 1, totalRoutes: 2 });
    expect(findRouteResult(matrix, "s1", "e2")?.timeMn).toBe(20);
  });

  it("세 출발지의 소수 평균과 공정성 점수는 원본 정밀도를 유지한다", () => {
    const threeStarts = [...starts, makeLocation("s3", "강남")];
    const summaries = buildCandidateSummaries(
      threeStarts,
      [ends[0]],
      [makeRoute("s1", "e1", 30), makeRoute("s2", "e1", 35), makeRoute("s3", "e1", 36)],
    );

    expect(summaries[0]).toMatchObject({
      averageMinutes: 101 / 3,
      maxMinutes: 36,
      score: 36 + 101 / 3,
    });
  });
});
