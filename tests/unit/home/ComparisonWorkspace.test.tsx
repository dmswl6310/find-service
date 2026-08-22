import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ComparisonWorkspace, {
  type ComparisonWorkspaceProps,
} from "@/app/home/ComparisonWorkspace";
import { useAppStore } from "@/store/useAppStore";
import { makeFailedRoute, makeLocation, makeRoute } from "@/tests/fixtures/transit";
import type { CandidateSummary } from "@/components/result/resultModel";
import type { MapPathPoint, MapRouteSegment } from "@/components/map/MiniMap";
import type { TransitFetchResult } from "@/types/odsay";

const mapState = vi.hoisted(() => ({
  activeMapRouteId: null as string | null,
  selectedRoute: null as TransitFetchResult | null,
  geometryRouteId: null as string | null,
  routeSegments: [] as MapRouteSegment[],
  detailedPath: [] as MapPathPoint[],
  handleSelectRoute: vi.fn(),
}));

vi.mock("@/app/home/useSelectedRouteMapState", () => ({
  useSelectedRouteMapState: () => mapState,
}));

vi.mock("@/components/map/MapWorkspace", () => ({
  default: ({
    selectedCandidate,
    selectedRouteName,
    selectedStartId,
    selectedEndId,
    routeSegments = [],
    detailedPath = [],
  }: {
    selectedCandidate?: CandidateSummary;
    selectedRouteName?: string;
    selectedStartId?: string;
    selectedEndId?: string;
    routeSegments?: MapRouteSegment[];
    detailedPath?: MapPathPoint[];
  }) => (
    <section aria-label="지도 테스트 표면">
      {selectedCandidate ? (
        <aside aria-label="선택 후보 요약">
          {selectedCandidate.name}
          {!selectedCandidate.isComplete
            ? ` 비교 불가 ${selectedCandidate.validRoutes}/${selectedCandidate.totalRoutes}`
            : null}
        </aside>
      ) : null}
      <output aria-label="지도 선택 출발지">{selectedStartId ?? "없음"}</output>
      <output aria-label="지도 선택 후보지">{selectedEndId ?? "없음"}</output>
      <output aria-label="지도 선택 경로명">{selectedRouteName ?? "없음"}</output>
      <output aria-label="지도 경로선 개수">{routeSegments.length}</output>
      <output aria-label="지도 상세 좌표 개수">{detailedPath.length}</output>
      <output aria-label="지도 경로선 좌표">
        {routeSegments.flatMap((segment) => segment.path).map((point) => `${point.lat},${point.lng}`).join("|") || "없음"}
      </output>
      <output aria-label="지도 상세 좌표">
        {detailedPath.map((point) => `${point.lat},${point.lng}`).join("|") || "없음"}
      </output>
    </section>
  ),
}));

vi.mock("@/app/home/LocationPanel", () => ({
  default: ({
    starts,
    onRemoveStart,
    onCalculate,
  }: {
    starts: ReturnType<typeof makeLocation>[];
    onRemoveStart: (id: string) => void;
    onCalculate: () => void;
  }) => (
    <section aria-label="장소 입력">
      {starts[0] ? (
        <button type="button" onClick={() => onRemoveStart(starts[0].id)}>
          첫 출발지 제거
        </button>
      ) : null}
      <button type="button" onClick={onCalculate}>계산하기</button>
    </section>
  ),
}));

vi.mock("@/app/home/ResultPanel", () => ({
  default: ({
    summaries,
    onEditInputs,
    onRetry,
    onSelectCandidate,
    onOpenMatrix,
  }: {
    summaries: CandidateSummary[];
    onEditInputs: () => void;
    onRetry: () => void;
    onSelectCandidate: (candidateId: string) => void;
    onOpenMatrix: () => void;
  }) => (
    <section aria-label="후보 비교 결과">
      <button type="button" onClick={onEditInputs}>장소 수정하기</button>
      <button type="button" onClick={onRetry}>다시 계산하기</button>
      <button type="button" onClick={onOpenMatrix}>경로표 열기</button>
      {summaries.map((summary) => (
        <button key={summary.id} type="button" onClick={() => onSelectCandidate(summary.id)}>
          {summary.name} 선택
        </button>
      ))}
    </section>
  ),
}));

const start = makeLocation("s1", "출발지");
const firstEnd = makeLocation("e1", "성공 후보");
const secondEnd = makeLocation("e2", "두 번째 후보");
const successfulRoute = makeRoute(start.id, firstEnd.id, 20);
const secondSuccessfulRoute = makeRoute(start.id, secondEnd.id, 25);
const oldSegment: MapRouteSegment = {
  kind: "bus",
  path: [{ lat: 37.5, lng: 127 }, { lat: 37.6, lng: 127.1 }],
};

const baseProps: ComparisonWorkspaceProps = {
  matrixData: [successfulRoute],
  isCalculating: false,
  calculateMatrix: vi.fn().mockResolvedValue(undefined),
  error: null,
  resetMatrix: vi.fn(),
  calculationProgress: { completed: 1, total: 1 },
};

function renderWorkspace(overrides: Partial<ComparisonWorkspaceProps> = {}) {
  return render(<ComparisonWorkspace {...baseProps} {...overrides} />);
}

describe("ComparisonWorkspace 상태 오케스트레이션", () => {
  beforeEach(() => {
    useAppStore.setState({
      starts: [start],
      ends: [firstEnd, secondEnd],
      useDepartureTime: false,
    });
    Object.assign(mapState, {
      activeMapRouteId: `${start.id}-${firstEnd.id}`,
      selectedRoute: successfulRoute,
      geometryRouteId: `${start.id}-${firstEnd.id}`,
      routeSegments: [oldSegment],
      detailedPath: [{ lat: 37.5, lng: 127 }, { lat: 37.6, lng: 127.1 }],
    });
    mapState.handleSelectRoute.mockReset();
    mapState.handleSelectRoute.mockImplementation((route: TransitFetchResult) => {
      mapState.activeMapRouteId = `${route.fromId}-${route.toId}`;
      mapState.selectedRoute = route;
      mapState.geometryRouteId = `${route.fromId}-${route.toId}`;
    });
  });

  it("matrix 결과가 없으면 입력 후보 요약과 이전 hook 경로를 지도에 전달하지 않는다", () => {
    renderWorkspace({ matrixData: [] });

    expect(screen.getByRole("region", { name: "장소 입력" })).toBeVisible();
    expect(screen.queryByLabelText("선택 후보 요약")).not.toBeInTheDocument();
    expect(screen.getByLabelText("지도 선택 경로명")).toHaveTextContent("없음");
    expect(screen.getByLabelText("지도 경로선 개수")).toHaveTextContent("0");
    expect(screen.getByLabelText("지도 상세 좌표 개수")).toHaveTextContent("0");
  });

  it("계산 중에는 edit 상태보다 loading을 우선하고 후보 요약과 경로를 숨긴다", () => {
    renderWorkspace({ isCalculating: true });

    expect(screen.getByRole("region", { name: "경로 계산 상태" })).toBeVisible();
    expect(screen.queryByLabelText("선택 후보 요약")).not.toBeInTheDocument();
    expect(screen.getByLabelText("지도 경로선 개수")).toHaveTextContent("0");
  });

  it("성공 경로가 없는 후보를 선택하면 후보 요약만 맞추고 이전 출발지와 경로를 지운다", () => {
    renderWorkspace({ matrixData: [successfulRoute, makeFailedRoute(start.id, secondEnd.id)] });

    fireEvent.click(screen.getByRole("button", { name: "두 번째 후보 선택" }));

    expect(screen.getByLabelText("선택 후보 요약")).toHaveTextContent("두 번째 후보");
    expect(screen.getByLabelText("지도 선택 출발지")).toHaveTextContent("없음");
    expect(screen.getByLabelText("지도 선택 후보지")).toHaveTextContent(secondEnd.id);
    expect(screen.getByLabelText("지도 선택 경로명")).toHaveTextContent("없음");
    expect(screen.getByLabelText("지도 경로선 개수")).toHaveTextContent("0");
    expect(screen.getByLabelText("지도 상세 좌표 개수")).toHaveTextContent("0");
  });

  it("성공 후보를 선택하면 같은 matrix route와 후보 요약을 함께 지도에 전달한다", () => {
    renderWorkspace({ matrixData: [successfulRoute, secondSuccessfulRoute] });

    fireEvent.click(screen.getByRole("button", { name: "두 번째 후보 선택" }));

    expect(screen.getByLabelText("선택 후보 요약")).toHaveTextContent("두 번째 후보");
    expect(screen.getByLabelText("지도 선택 출발지")).toHaveTextContent(start.id);
    expect(screen.getByLabelText("지도 선택 후보지")).toHaveTextContent(secondEnd.id);
    expect(screen.getByLabelText("지도 선택 경로명")).toHaveTextContent(
      "출발지에서 두 번째 후보까지",
    );
    expect(screen.getByLabelText("지도 경로선 개수")).toHaveTextContent("1");
  });

  it("새 route commit의 이름과 marker에 이전 owner 좌표를 함께 전달하지 않는다", () => {
    Object.assign(mapState, {
      activeMapRouteId: `${start.id}-${secondEnd.id}`,
      selectedRoute: secondSuccessfulRoute,
      geometryRouteId: `${start.id}-${firstEnd.id}`,
      routeSegments: [oldSegment],
      detailedPath: [{ lat: 37.5, lng: 127 }, { lat: 37.6, lng: 127.1 }],
    });

    renderWorkspace({ matrixData: [successfulRoute, secondSuccessfulRoute] });

    expect(screen.getByLabelText("지도 선택 경로명")).toHaveTextContent(
      "출발지에서 두 번째 후보까지",
    );
    expect(screen.getByLabelText("지도 경로선 좌표")).toHaveTextContent("없음");
    expect(screen.getByLabelText("지도 상세 좌표")).toHaveTextContent("없음");
    expect(screen.getByLabelText("지도 경로선 좌표")).not.toHaveTextContent("37.5,127");
  });

  it("새 matrix가 같은 쌍의 전면 실패여도 이전 성공 route 객체를 지도에 재사용하지 않는다", () => {
    renderWorkspace({ matrixData: [makeFailedRoute(start.id, firstEnd.id)] });

    expect(screen.getByLabelText("선택 후보 요약")).toHaveTextContent("성공 후보 비교 불가 0/1");
    expect(screen.getByLabelText("지도 선택 경로명")).toHaveTextContent("없음");
    expect(screen.getByLabelText("지도 경로선 개수")).toHaveTextContent("0");
    expect(screen.getByLabelText("지도 상세 좌표 개수")).toHaveTextContent("0");
  });

  it("외부 loading이 edit을 즉시 숨기고 완료 뒤 stale edit을 다시 열지 않는다", () => {
    const resetMatrix = vi.fn();
    const calculateMatrix = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderWorkspace({ resetMatrix, calculateMatrix });

    fireEvent.click(screen.getByRole("button", { name: "장소 수정하기" }));

    expect(screen.getByRole("region", { name: "장소 입력" })).toBeVisible();
    expect(screen.getByLabelText("선택 후보 요약")).toHaveTextContent("성공 후보");
    expect(resetMatrix).not.toHaveBeenCalled();

    rerender(
      <ComparisonWorkspace
        {...baseProps}
        resetMatrix={resetMatrix}
        calculateMatrix={calculateMatrix}
        isCalculating
      />,
    );
    expect(screen.getByRole("region", { name: "경로 계산 상태" })).toBeVisible();

    rerender(
      <ComparisonWorkspace
        {...baseProps}
        resetMatrix={resetMatrix}
        calculateMatrix={calculateMatrix}
      />,
    );
    expect(screen.getByRole("region", { name: "후보 비교 결과" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "장소 수정하기" }));
    fireEvent.click(screen.getByRole("button", { name: "계산하기" }));
    expect(calculateMatrix).toHaveBeenCalledOnce();
    expect(screen.getByRole("region", { name: "후보 비교 결과" })).toBeVisible();

    rerender(
      <ComparisonWorkspace
        {...baseProps}
        resetMatrix={resetMatrix}
        calculateMatrix={calculateMatrix}
        isCalculating
      />,
    );
    expect(screen.getByRole("region", { name: "경로 계산 상태" })).toBeVisible();
  });

  it("외부 loading이 matrix를 즉시 숨기고 완료 뒤 stale matrix를 다시 열지 않는다", () => {
    const { rerender } = renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "경로표 열기" }));
    expect(screen.getByRole("region", { name: "경로표" })).toBeVisible();

    rerender(<ComparisonWorkspace {...baseProps} isCalculating />);
    expect(screen.getByRole("region", { name: "경로 계산 상태" })).toBeVisible();
    expect(screen.queryByRole("region", { name: "경로표" })).not.toBeInTheDocument();

    rerender(<ComparisonWorkspace {...baseProps} />);
    expect(screen.getByRole("region", { name: "후보 비교 결과" })).toBeVisible();
    expect(screen.queryByRole("region", { name: "경로표" })).not.toBeInTheDocument();
  });

  it("외부 loading이 route detail을 즉시 숨기고 완료 뒤 stale detail을 다시 열지 않는다", () => {
    const { rerender } = renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "경로표 열기" }));
    fireEvent.click(
      screen.getByRole("button", { name: "출발지에서 성공 후보까지 상세 경로 보기" }),
    );
    expect(screen.getByRole("dialog")).toBeVisible();

    rerender(<ComparisonWorkspace {...baseProps} isCalculating />);
    expect(screen.getByRole("region", { name: "경로 계산 상태" })).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(<ComparisonWorkspace {...baseProps} />);
    expect(screen.getByRole("region", { name: "후보 비교 결과" })).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
