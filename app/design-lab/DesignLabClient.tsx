"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import LocationPanel from "@/app/home/LocationPanel";
import ResultPanel from "@/app/home/ResultPanel";
import { designLabFixtures } from "@/components/design-lab/fixtures";
import PlaceRow from "@/components/location/PlaceRow";
import StaticMapSurface from "@/components/map/StaticMapSurface";
import CalculationProgress from "@/components/result/CalculationProgress";
import RouteDetailSheet from "@/components/result/RouteDetailSheet";
import RouteMatrix from "@/components/result/RouteMatrix";
import { buildCandidateSummaries } from "@/components/result/resultModel";
import Button from "@/components/ui/Button";
import BottomSheet from "@/components/ui/BottomSheet";
import IconButton from "@/components/ui/IconButton";
import InlineNotice from "@/components/ui/InlineNotice";
import Progress from "@/components/ui/Progress";
import type { LocationSearchProps } from "@/components/location/LocationSearch";
import type { TransitFetchResult } from "@/types/odsay";

export const designLabScenarios = [
  "foundation",
  "empty",
  "input",
  "loading",
  "result",
  "partial-failure",
  "total-failure",
] as const;

type DesignLabScenario = (typeof designLabScenarios)[number];

const scenarioLabels: Record<DesignLabScenario, string> = {
  foundation: "기반 카탈로그",
  empty: "빈 상태",
  input: "장소 입력",
  loading: "계산 중",
  result: "비교 결과",
  "partial-failure": "부분 실패",
  "total-failure": "전체 실패",
};

export function isDesignLabScenario(value: string | null): value is DesignLabScenario {
  return designLabScenarios.some((scenario) => scenario === value);
}

type PlaceStateExampleProps = {
  title: string;
  locations: typeof designLabFixtures.starts;
  selectedId?: string;
};

function PlaceStateExample({ title, locations, selectedId }: PlaceStateExampleProps) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4" aria-labelledby={`${title}-heading`}>
      <h3 id={`${title}-heading`} className="text-base font-semibold text-text">장소 상태: {title}</h3>
      <ul className="mt-3 flex min-h-16 flex-col gap-2 rounded-lg border border-dashed border-border bg-surface-raised p-3">
        {locations.map((location, index) => (
          <PlaceRow key={location.id} location={location} kind="origin" index={index} selected={selectedId === location.id} onSelect={() => undefined} onRemove={() => undefined} />
        ))}
        {locations.length === 0 && <li className="py-2 text-sm text-text-muted">친구들이 출발하는 역이나 장소를 추가해 주세요.</li>}
      </ul>
    </section>
  );
}

function FixedLocationSearch({ label, placeholder = "장소 검색", helperText }: LocationSearchProps) {
  return (
    <div className="w-full">
      <label className="sr-only">{label}</label>
      <input
        type="text"
        value=""
        disabled
        readOnly
        placeholder={placeholder}
        aria-label={label}
        className="w-full rounded-xl border border-border bg-surface-raised px-4 py-3 text-text"
      />
      {helperText && <p className="mt-2 text-xs text-text-muted">{helperText}</p>}
      <p className="mt-2 text-xs text-text-muted">고정 fixture 입력으로, 장소 검색을 실행하지 않습니다.</p>
    </div>
  );
}

type VisualScenario = Exclude<DesignLabScenario, "foundation">;

function ScenarioPanel({ scenario }: { scenario: VisualScenario }) {
  const starts = scenario === "empty" ? [] : [...designLabFixtures.starts];
  const candidates = scenario === "empty" ? [] : [...designLabFixtures.candidates];
  const matrixByScenario: Record<VisualScenario, TransitFetchResult[]> = {
    empty: [],
    input: [],
    loading: [],
    result: [...designLabFixtures.successfulRoutes],
    "partial-failure": [...designLabFixtures.partialFailureMatrix],
    "total-failure": [...designLabFixtures.totalFailureMatrix],
  };
  const matrixData = matrixByScenario[scenario];
  const summaries = buildCandidateSummaries(starts, candidates, matrixData);
  const total = designLabFixtures.starts.length * designLabFixtures.candidates.length;

  if (scenario === "empty" || scenario === "input") {
    return (
      <LocationPanel
        starts={starts}
        ends={candidates}
        selectedStartId={scenario === "input" ? starts[0]?.id : undefined}
        selectedEndId={scenario === "input" ? candidates[0]?.id : undefined}
        onAddStart={() => undefined}
        onAddEnd={() => undefined}
        onRemoveStart={() => undefined}
        onRemoveEnd={() => undefined}
        onSelectStart={() => undefined}
        onSelectEnd={() => undefined}
        onCalculate={() => undefined}
        SearchComponent={FixedLocationSearch}
      />
    );
  }

  if (scenario === "loading") {
    return (
      <CalculationProgress
        completed={6}
        total={total}
        currentCandidate={designLabFixtures.candidates[2].place_name}
      />
    );
  }

  return (
    <ResultPanel
      summaries={summaries}
      matrixData={matrixData}
      calculationProgress={{ completed: total, total }}
      isCalculating={false}
      error={scenario === "total-failure" ? "모든 경로 계산에 실패했습니다." : null}
      onEditInputs={() => undefined}
      onRetry={() => undefined}
      onSelectCandidate={() => undefined}
      onOpenMatrix={() => undefined}
    />
  );
}

function MapStatus({ scenario }: { scenario: VisualScenario }) {
  const statusByScenario: Record<VisualScenario, { eyebrow: string; title: string; description: string }> = {
    empty: {
      eyebrow: "입력 대기",
      title: "서울 전역을 한눈에 비교하세요",
      description: "출발지와 후보지를 추가하면 번호와 문자 마커로 구분해 표시합니다.",
    },
    input: {
      eyebrow: "6개 장소",
      title: "출발지 3곳 · 후보지 3곳",
      description: "서로 다른 형태와 레이블로 두 장소 그룹을 구분합니다.",
    },
    loading: {
      eyebrow: "6 / 9 경로 완료",
      title: "광화문역 경로를 계산 중입니다",
      description: "입력한 장소는 그대로 두고 완료된 경로 수를 알려드립니다.",
    },
    result: {
      eyebrow: "황금 밸런스",
      title: "을지로입구역",
      description: "강남역에서 을지로입구역까지 30분 경로를 선택했습니다.",
    },
    "partial-failure": {
      eyebrow: "8 / 9 경로 완료",
      title: "성공한 결과를 유지합니다",
      description: "실패한 1개 경로는 안내하고 계산된 후보는 계속 비교합니다.",
    },
    "total-failure": {
      eyebrow: "경로 계산 실패",
      title: "입력한 장소는 유지됩니다",
      description: "잠시 후 다시 계산하거나 장소를 수정할 수 있습니다.",
    },
  };
  const status = statusByScenario[scenario];

  return (
    <div className="absolute inset-x-6 top-6 z-10 max-w-sm rounded-xl border border-border bg-surface/95 p-4 shadow-sm md:hidden lg:block">
      <p className="text-xs font-semibold text-action">{status.eyebrow}</p>
      <p className="mt-1 font-semibold text-text">{status.title}</p>
      <p className="mt-1 text-sm leading-5 text-text-muted">{status.description}</p>
    </div>
  );
}

function ScenarioWorkspace({ scenario }: { scenario: VisualScenario }) {
  return (
    <section
      aria-label={`${scenarioLabels[scenario]} 시각 시나리오`}
      className="relative isolate grid min-h-[720px] min-w-0 overflow-hidden bg-canvas md:grid-cols-[minmax(320px,360px)_minmax(0,1fr)]"
    >
      <aside
        data-testid="design-lab-panel"
        className="relative z-20 col-start-1 row-start-1 mt-60 min-w-0 self-end md:mt-0 md:self-stretch"
      >
        <BottomSheet
          title="비교 패널"
          className="md:h-full md:rounded-none md:border-x-0 md:border-b-0 md:shadow-none"
        >
          <div className="min-w-0 p-4 sm:p-5">
            <header className="mb-5 border-b border-border pb-5">
              <p className="text-xs font-semibold text-action">대중교통 약속 장소 비교</p>
              <h2 className="mt-2 text-2xl font-semibold leading-tight text-text">
                어디서 만나는 게 가장 균형 잡힐까요?
              </h2>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                출발지와 후보지를 추가하면 이동시간의 균형을 비교합니다.
              </p>
            </header>
            <ScenarioPanel scenario={scenario} />
          </div>
        </BottomSheet>
      </aside>

      <section
        data-testid="design-lab-map"
        data-static-map-state={scenario}
        aria-label="출발지와 후보지 지도"
        className="absolute inset-0 z-0 min-h-0 min-w-0 p-3 pb-0 [&>[role=img]]:h-full [&>[role=img]]:min-h-full md:relative md:col-start-2 md:row-start-1 md:p-4"
      >
        <style>{`
          [data-static-map-state="empty"] > [role="img"] > span {
            display: none;
          }
          [data-static-map-state="empty"] > [role="img"] > div:nth-of-type(5),
          [data-static-map-state="empty"] > [role="img"] > div:nth-of-type(6),
          [data-static-map-state="input"] > [role="img"] > div:nth-of-type(5),
          [data-static-map-state="input"] > [role="img"] > div:nth-of-type(6),
          [data-static-map-state="loading"] > [role="img"] > div:nth-of-type(5),
          [data-static-map-state="loading"] > [role="img"] > div:nth-of-type(6),
          [data-static-map-state="total-failure"] > [role="img"] > div:nth-of-type(5),
          [data-static-map-state="total-failure"] > [role="img"] > div:nth-of-type(6) {
            display: none;
          }
        `}</style>
        <StaticMapSurface />
        <MapStatus scenario={scenario} />
      </section>
    </section>
  );
}

function FoundationState() {
  const partialFailureCount = designLabFixtures.partialFailureMatrix.filter((route) => route.error).length;
  const [selectedRoute, setSelectedRoute] = useState<{
    result: TransitFetchResult;
    startName: string;
    endName: string;
  } | null>(null);
  const routeExample: TransitFetchResult = {
    fromId: designLabFixtures.starts[0].id,
    toId: designLabFixtures.candidates[0].id,
    timeMn: 35,
    payment: 1_500,
    pathType: 3,
    transitCount: 1,
    subPath: [
      { trafficType: 3, distance: 360, sectionTime: 5 },
      {
        trafficType: 1,
        distance: 5_100,
        sectionTime: 20,
        stationCount: 8,
        startName: "강남역",
        endName: "을지로3가역",
        lane: [{ name: "지하철 2호선" }],
      },
      {
        trafficType: 2,
        distance: 900,
        sectionTime: 7,
        stationCount: 3,
        startName: "을지로3가역",
        endName: "을지로입구역",
        lane: [{ busNo: "701" }],
      },
    ],
  };

  return (
    <div className="space-y-8">
      <section aria-labelledby="tokens-heading" className="rounded-xl border border-border bg-surface p-5">
        <h2 id="tokens-heading" className="text-lg font-semibold text-text">시맨틱 토큰</h2>
        <p className="mt-2 text-sm text-text-muted">canvas, surface, action, origin, candidate, balance, success, warning, danger, info</p>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="시맨틱 색상 토큰 견본">
          <span className="rounded-full bg-origin-soft px-3 py-1 text-sm text-origin">출발지</span>
          <span className="rounded-full bg-candidate-soft px-3 py-1 text-sm text-candidate">후보지</span>
          <span className="rounded-full bg-balance-soft px-3 py-1 text-sm text-balance">균형</span>
        </div>
      </section>

      <section aria-labelledby="controls-heading" className="rounded-xl border border-border bg-surface p-5">
        <h2 id="controls-heading" className="text-lg font-semibold text-text">버튼과 아이콘 버튼</h2>
        <div className="mt-4 flex items-center gap-3">
          <Button type="button">주요 동작</Button>
          <IconButton aria-label="설정 열기" type="button" variant="secondary">
            <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Zm0 10a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5ZM4.75 12a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 0 0-4.5 0Zm10 0a2.25 2.25 0 1 0 4.5 2.25 2.25 0 0 0-4.5 0Z" />
            </svg>
          </IconButton>
        </div>
      </section>

      <section aria-labelledby="feedback-heading" className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <h2 id="feedback-heading" className="text-lg font-semibold text-text">진행률과 안내</h2>
        <Progress value={6} max={9} label="경로 계산 진행률" />
        <p className="text-sm text-text-muted">출발지 3개, 후보지 3개, 성공 경로 9개를 고정으로 제공합니다.</p>
        <InlineNotice tone="warning" title="부분 실패 매트릭스">{partialFailureCount}개 경로가 실패해도 나머지 성공 결과는 유지합니다.</InlineNotice>
        <BottomSheet title="고정 결과 미리보기" className="p-5">
          <p className="font-medium text-text">고정 결과 미리보기</p>
          <p className="mt-1 text-sm text-text-muted">네트워크 요청 없이 결정적인 fixture만 사용합니다.</p>
        </BottomSheet>
      </section>

      <section aria-labelledby="locations-heading" className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <h2 id="locations-heading" className="text-lg font-semibold text-text">장소 입력 상태</h2>
        <p className="text-sm text-text-muted">모든 사례는 네트워크 요청 없이 고정 fixture와 정적 표현만 사용합니다.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <PlaceStateExample title="비어 있음" locations={[]} />
          <PlaceStateExample title="1개" locations={[designLabFixtures.starts[0]]} />
          <PlaceStateExample title="3개" locations={designLabFixtures.starts} />
          <PlaceStateExample title="선택됨" locations={designLabFixtures.starts} selectedId={designLabFixtures.starts[1].id} />
        </div>
      </section>

      <section aria-labelledby="search-state-heading" className="rounded-xl border border-border bg-surface p-5">
        <h2 id="search-state-heading" className="text-lg font-semibold text-text">장소 검색 상태</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <section className="rounded-xl border border-border bg-surface-raised p-4" aria-labelledby="loading-search-heading">
            <h3 id="loading-search-heading" className="text-base font-semibold text-text">검색 중</h3>
            <div className="mt-3 flex items-center gap-2 text-sm text-text-muted" role="status" aria-label="장소 검색 중">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-origin border-t-transparent" aria-hidden="true" />
              장소를 검색하고 있습니다.
            </div>
          </section>
          <section className="rounded-xl border border-border bg-surface-raised p-4" aria-labelledby="empty-search-heading">
            <h3 id="empty-search-heading" className="text-base font-semibold text-text">검색 결과 없음</h3>
            <p className="mt-3 text-sm text-text-muted">검색 결과가 없습니다. 다른 키워드로 시도해 보세요.</p>
          </section>
          <section className="rounded-xl border border-danger bg-surface-raised p-4" aria-labelledby="error-search-heading">
            <h3 id="error-search-heading" className="text-base font-semibold text-text">검색 오류</h3>
            <p className="mt-3 text-sm text-danger" role="alert">장소 검색 중 오류가 발생했습니다.</p>
          </section>
        </div>
      </section>

      <section aria-labelledby="routes-heading" className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <div>
          <h2 id="routes-heading" className="text-lg font-semibold text-text">경로 매트릭스와 상세 시트</h2>
          <p className="mt-2 text-sm text-text-muted">고정 도보·지하철·버스 구간으로 지도 선택과 상세 열기를 점검합니다.</p>
        </div>
        <RouteMatrix
          starts={[designLabFixtures.starts[0]]}
          ends={[designLabFixtures.candidates[0]]}
          matrixData={[routeExample]}
          onSelectRoute={() => undefined}
          onOpenRoute={(result, startName, endName) => setSelectedRoute({ result, startName, endName })}
        />
        <RouteDetailSheet
          isOpen={selectedRoute !== null}
          onClose={() => setSelectedRoute(null)}
          result={selectedRoute?.result ?? null}
          startName={selectedRoute?.startName ?? ""}
          endName={selectedRoute?.endName ?? ""}
        />
      </section>

      <section aria-labelledby="map-surface-heading" className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <div>
          <h2 id="map-surface-heading" className="text-lg font-semibold text-text">고정 지도 표면</h2>
          <p className="mt-2 text-sm text-text-muted">외부 API 없이 도로, 출발지, 후보지와 선택 경로를 재현합니다.</p>
        </div>
        <StaticMapSurface />
      </section>

    </div>
  );
}

export default function DesignLabClient() {
  const scenarioValue = useSearchParams().get("scenario");
  const scenario: DesignLabScenario = isDesignLabScenario(scenarioValue)
    ? scenarioValue
    : "foundation";

  const handleScenarioChange = (nextScenario: string) => {
    if (!isDesignLabScenario(nextScenario)) return;
    window.location.assign(`/design-lab?scenario=${nextScenario}`);
  };

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-canvas">
      <header className="flex flex-col gap-4 border-b border-border bg-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-text">Design Lab</h1>
          <p className="mt-1 text-sm text-text-muted">
            고정 데이터와 승인된 시맨틱 토큰으로 화면 상태를 점검합니다.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <label htmlFor="design-lab-scenario" className="text-sm font-medium text-text">
            시각 시나리오
          </label>
          <select
            id="design-lab-scenario"
            value={scenario}
            onChange={(event) => handleScenarioChange(event.target.value)}
            className="min-h-11 rounded-lg border border-border-strong bg-surface px-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2"
          >
            {designLabScenarios.map((option) => (
              <option key={option} value={option}>
                {scenarioLabels[option]}
              </option>
            ))}
          </select>
        </div>
      </header>
      {scenario === "foundation" ? (
        <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-10 sm:px-6 md:px-8">
          <FoundationState />
        </div>
      ) : (
        <ScenarioWorkspace scenario={scenario} />
      )}
    </main>
  );
}
