import { makeFailedRoute, makeLocation, makeRoute } from "@/tests/fixtures/transit";

const starts = [
  makeLocation("design-lab-start-1", "강남역"),
  makeLocation("design-lab-start-2", "홍대입구역"),
  makeLocation("design-lab-start-3", "잠실역"),
];

const candidates = [
  makeLocation("design-lab-candidate-1", "을지로입구역"),
  makeLocation("design-lab-candidate-2", "성수역"),
  makeLocation("design-lab-candidate-3", "광화문역"),
];

export const designLabFixtures = {
  starts,
  candidates,
  successfulRoutes: [
    makeRoute(starts[0].id, candidates[0].id, 30),
    makeRoute(starts[1].id, candidates[0].id, 36),
    makeRoute(starts[2].id, candidates[0].id, 36),
    makeRoute(starts[0].id, candidates[1].id, 42),
    makeRoute(starts[1].id, candidates[1].id, 30),
    makeRoute(starts[2].id, candidates[1].id, 24),
    makeRoute(starts[0].id, candidates[2].id, 33),
    makeRoute(starts[1].id, candidates[2].id, 42),
    makeRoute(starts[2].id, candidates[2].id, 33),
  ],
  partialFailureMatrix: [
    makeRoute(starts[0].id, candidates[0].id, 30),
    makeRoute(starts[1].id, candidates[0].id, 36),
    makeRoute(starts[2].id, candidates[0].id, 36),
    makeRoute(starts[0].id, candidates[1].id, 42),
    makeFailedRoute(starts[1].id, candidates[1].id),
    makeRoute(starts[2].id, candidates[1].id, 24),
    makeRoute(starts[0].id, candidates[2].id, 33),
    makeRoute(starts[1].id, candidates[2].id, 42),
    makeRoute(starts[2].id, candidates[2].id, 33),
  ],
  totalFailureMatrix: starts.flatMap((start) =>
    candidates.map((candidate) => makeFailedRoute(start.id, candidate.id)),
  ),
} as const;
