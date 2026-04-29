import MiniMap from "@/components/map/MiniMap";
import ResultTable from "@/components/result/ResultTable";
import LocationInput from "@/components/search/LocationInput";
import ShareButton from "@/components/search/ShareButton";
import TimeFilter from "@/components/search/TimeFilter";
import { useAppStore } from "@/store/useAppStore";
import type { KakaoLocation } from "@/types/kakao";
import type { TransitFetchResult } from "@/types/odsay";
import { useSelectedRouteMapState } from "./useSelectedRouteMapState";

type MainContentProps = {
  matrixData: TransitFetchResult[];
  isCalculating: boolean;
  calculateMatrix: (starts: KakaoLocation[], ends: KakaoLocation[], targetDate?: string, targetTime?: string) => Promise<void>;
  error: string | null;
  resetMatrix: () => void;
};

export default function MainContent({ matrixData, isCalculating, calculateMatrix, error, resetMatrix }: MainContentProps) {
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

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="mb-10 text-center lg:text-left pt-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              약속 장소 <span className="text-primary">대중교통 비교기</span>
            </h1>
            <ShareButton />
          </div>
          <p className="text-foreground/70 text-lg md:text-xl leading-relaxed">
            출발지와 후보 장소를 추가하고 바로 비교해보세요. 각 조합의
            대중교통 소요시간을 표와 지도에서 한 번에 확인할 수 있습니다.
          </p>
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
            <LocationInput placeholder="출발지 추가" onSelect={handleAddStart} />
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
                    aria-label="제거"
                  >
                    <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
              {starts.length === 0 && <li className="text-sm text-sky-900/45">출발지 추가</li>}
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
            <LocationInput placeholder="목적지 후보 추가" onSelect={handleAddEnd} />
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
                    aria-label="제거"
                  >
                    <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
              {ends.length === 0 && <li className="text-sm text-emerald-900/45">목적지 후보 추가</li>}
            </ul>
          </div>
        </section>

        <div className="flex flex-col gap-4 mb-16">
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
