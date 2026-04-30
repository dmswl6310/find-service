import MiniMap from "@/components/map/MiniMap";
import ResultTable from "@/components/result/ResultTable";
import LocationInput from "@/components/search/LocationInput";
import ShareButton from "@/components/search/ShareButton";
import TimeFilter from "@/components/search/TimeFilter";
import { useAppStore } from "@/store/useAppStore";
import type { KakaoLocation } from "@/types/kakao";
import type { TransitFetchResult } from "@/types/odsay";
import type { CalculationProgress } from "@/hooks/useTransitMatrix";
import { useSelectedRouteMapState } from "./useSelectedRouteMapState";

type MainContentProps = {
  matrixData: TransitFetchResult[];
  isCalculating: boolean;
  calculateMatrix: (starts: KakaoLocation[], ends: KakaoLocation[], targetDate?: string, targetTime?: string) => Promise<void>;
  error: string | null;
  resetMatrix: () => void;
  calculationProgress: CalculationProgress;
};

export default function MainContent({ matrixData, isCalculating, calculateMatrix, error, resetMatrix, calculationProgress }: MainContentProps) {
  const { starts, ends, addStart, removeStart, addEnd, removeEnd, useDepartureTime, targetDate, targetTime } = useAppStore();
  const { activeMapRouteId, selectedRoute, routeSegments, detailedPath, handleSelectRoute } = useSelectedRouteMapState({
    starts,
    ends,
    matrixData,
    isCalculating,
  });

  const handleCalculateClick = () => {
    calculateMatrix(starts, ends, useDepartureTime ? targetDate : undefined, useDepartureTime ? targetTime : undefined);
  };

  const handleAddStart = (location: KakaoLocation) => {
    resetMatrix();
    addStart(location);
  };

  const handleRemoveStart = (id: string) => {
    resetMatrix();
    removeStart(id);
  };

  const handleAddEnd = (location: KakaoLocation) => {
    resetMatrix();
    addEnd(location);
  };

  const handleRemoveEnd = (id: string) => {
    resetMatrix();
    removeEnd(id);
  };

  const totalCombinations = starts.length * ends.length;
  const selectedStartName = starts.find((start) => start.id === selectedRoute?.fromId)?.place_name;
  const selectedEndName = ends.find((end) => end.id === selectedRoute?.toId)?.place_name;
  const calculationStatus = isCalculating
    ? calculationProgress.total > 0
      ? `${calculationProgress.total}개 조합을 확인 중입니다. 완료 ${calculationProgress.completed}/${calculationProgress.total}`
      : `${totalCombinations}개 조합을 확인할 준비 중입니다.`
    : totalCombinations > 0
      ? `${starts.length}개 출발지와 ${ends.length}개 후보, 총 ${totalCombinations}개 경로를 비교합니다.`
      : "출발지와 목적지 후보를 추가하면 다대다 경로를 비교합니다.";

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="mb-10 text-center lg:text-left pt-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              여러명 <span className="text-primary">중간지점·중간거리</span> 비교
            </h1>
            <ShareButton />
          </div>
          <p className="text-foreground/70 text-lg md:text-xl leading-relaxed">
            여러 출발지와 여러 목적지를 추가하고 바로 비교해보세요. 다대다
            대중교통 소요시간을 표와 지도에서 확인해 중간 약속 장소를 고를 수 있습니다.
          </p>
          <p className="mt-3 text-sm leading-6 text-foreground/55">
            친구 모임, 스터디, 회식처럼 출발지가 제각각일 때 여러명 거리비교와
            후보 장소별 중간거리 판단을 한 번에 도와줍니다.
          </p>
          <ol className="mt-5 grid gap-2 text-left text-xs font-medium text-foreground/65 sm:grid-cols-3">
            <li className="rounded-2xl border border-border bg-surface px-3 py-2">1. 각자 출발지를 추가</li>
            <li className="rounded-2xl border border-border bg-surface px-3 py-2">2. 만날 후보 장소를 추가</li>
            <li className="rounded-2xl border border-border bg-surface px-3 py-2">3. 황금 밸런스와 상세 경로 비교</li>
          </ol>
        </header>

        <TimeFilter />

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="flex flex-col gap-4 rounded-3xl border border-sky-300/50 bg-sky-500/[0.06] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/15 text-lg">🏠</span>
                <div>
                  <h2 className="text-xl font-bold text-sky-950/90">출발지</h2>
                </div>
              </div>
              <span className="rounded-full border border-sky-400/30 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-sky-700 whitespace-nowrap">
                {starts.length}개
              </span>
            </div>
            <LocationInput placeholder="출발지 추가" helperText="예: 강남역, 홍대입구역, 회사 주소" onSelect={handleAddStart} />
            <ul
              className={`mt-1 flex min-h-16 flex-wrap gap-2 rounded-2xl border border-dashed px-3 py-3 ${starts.length > 0 ? "border-sky-400/30 bg-white/60" : "border-sky-300/30 bg-white/40"}`}
            >
              {starts.map((start) => (
                <li
                  key={start.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1.5 text-sm font-medium text-sky-800"
                >
                  {start.place_name}
                  <button
                    type="button"
                    onClick={() => handleRemoveStart(start.id)}
                    className="rounded-full p-0.5 hover:bg-sky-500/15"
                    aria-label={`${start.place_name} 출발지 제거`}
                  >
                    <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
              {starts.length === 0 && <li className="text-sm text-sky-900/45">친구들이 출발하는 역이나 장소를 추가해 주세요.</li>}
            </ul>
          </div>

          <div className="flex flex-col gap-4 rounded-3xl border border-emerald-300/50 bg-emerald-500/[0.06] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-lg">🏁</span>
                <div>
                  <h2 className="text-xl font-bold text-emerald-950/90">목적지 후보</h2>
                </div>
              </div>
              <span className="rounded-full border border-emerald-400/30 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 whitespace-nowrap">
                {ends.length}개
              </span>
            </div>
            <LocationInput placeholder="목적지 후보 추가" helperText="예: 성수동, 종로3가역, 예약하려는 식당" onSelect={handleAddEnd} />
            <ul
              className={`mt-1 flex min-h-16 flex-wrap gap-2 rounded-2xl border border-dashed px-3 py-3 ${ends.length > 0 ? "border-emerald-400/30 bg-white/60" : "border-emerald-300/30 bg-white/40"}`}
            >
              {ends.map((end) => (
                <li
                  key={end.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-800"
                >
                  {end.place_name}
                  <button
                    type="button"
                    onClick={() => handleRemoveEnd(end.id)}
                    className="rounded-full p-0.5 hover:bg-emerald-500/15"
                    aria-label={`${end.place_name} 목적지 후보 제거`}
                  >
                    <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
              {ends.length === 0 && <li className="text-sm text-emerald-900/45">비교하고 싶은 약속 장소 후보를 추가해 주세요.</li>}
            </ul>
          </div>
        </section>

        <div className="flex flex-col gap-4 mb-16">
          <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-xs leading-5 text-foreground/60">
            대중교통 경로는 카카오 장소 검색과 ODSAY 경로 데이터를 기준으로 계산됩니다. 일부 지역·시간대·짧은 거리 조합은 결과가 없거나 달라질 수 있습니다.
          </p>
          <p className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm font-medium text-primary" role="status" aria-live="polite">
            {calculationStatus}
          </p>
          <button
            type="button"
            onClick={handleCalculateClick}
            disabled={isCalculating || starts.length === 0 || ends.length === 0}
            className="w-full py-4 bg-primary text-white text-lg font-bold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transform transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-primary/30"
          >
            {isCalculating ? "경로 계산 중..." : "소요시간 비교하기 🚀"}
          </button>
          {error && <p className="text-red-500 font-medium text-center">{error}</p>}
        </div>

        {(matrixData.length > 0 || isCalculating) && (
          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">📊 소요시간 비교 결과</h2>
            <ResultTable
              starts={starts}
              ends={ends}
              matrixData={matrixData}
              isCalculating={isCalculating}
              onSelectRoute={handleSelectRoute}
              activeMapRouteId={activeMapRouteId || undefined}
            />
          </section>
        )}
      </div>

      <div className="w-full lg:w-[400px] xl:w-[500px] shrink-0">
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground/70 shadow-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-sky-800">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
            출발지
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-800">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            목적지
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-primary">
            <span className="h-0.5 w-4 rounded-full bg-primary" />
            선택 경로
          </span>
          {selectedRoute && selectedStartName && selectedEndName && (
            <span className="basis-full rounded-xl bg-primary/5 px-2.5 py-1.5 text-primary sm:basis-auto">
              현재 선택: {selectedStartName} → {selectedEndName}
            </span>
          )}
        </div>
        <div className="sticky top-8 h-[400px] lg:h-[calc(100vh-4rem)] rounded-xl overflow-hidden shadow-lg border border-border">
          <MiniMap
            starts={starts}
            ends={ends}
            routeSegments={routeSegments}
            detailedPath={detailedPath}
            selectedStartId={selectedRoute?.fromId}
            selectedEndId={selectedRoute?.toId}
          />
        </div>
      </div>
    </div>
  );
}
