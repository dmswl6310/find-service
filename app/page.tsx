"use client";

import LocationInput from "@/components/search/LocationInput";
import ResultTable from "@/components/result/ResultTable";
import { useAppStore } from "@/store/useAppStore";
import { useTransitMatrix } from "@/hooks/useTransitMatrix";

export default function Home() {
  const { starts, ends, addStart, removeStart, addEnd, removeEnd, clearAll } = useAppStore();
  const { matrixData, isCalculating, calculateMatrix, error } = useTransitMatrix();

  const handleCalculate = () => {
    calculateMatrix(starts, ends);
  };

  return (
    <main className="flex-1 w-full max-w-5xl mx-auto p-6 md:p-12 mb-20">
      <header className="mb-10 lg:mb-16 text-center pt-8">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
          다대다 최적 경로 <span className="text-primary">비교기</span>
        </h1>
        <p className="text-foreground/70 text-lg md:text-xl">
          친구들과의 약속 장소? 단체 모임? 검색 한 번으로 싹 비교하세요.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* 출발지 입력 세션 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">🏠 출발지 ({starts.length})</h2>
          </div>
          <LocationInput placeholder="예: 강남역, 우리집" onSelect={addStart} />
          <ul className="flex flex-wrap gap-2 mt-2">
            {starts.map((start) => (
              <li
                key={start.id}
                className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium border border-primary/20"
              >
                {start.place_name}
                <button
                  type="button"
                  onClick={() => removeStart(start.id)}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label="제거"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* 목적지 입력 세션 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">🏁 목적지 후보 ({ends.length})</h2>
          </div>
          <LocationInput placeholder="예: 홍대입구, 여의도 한강공원" onSelect={addEnd} />
          <ul className="flex flex-wrap gap-2 mt-2">
            {ends.map((end) => (
              <li
                key={end.id}
                className="inline-flex items-center gap-1.5 bg-foreground/10 text-foreground px-3 py-1.5 rounded-full text-sm font-medium border border-border"
              >
                {end.place_name}
                <button
                  type="button"
                  onClick={() => removeEnd(end.id)}
                  className="hover:bg-foreground/20 rounded-full p-0.5"
                  aria-label="제거"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 실행 버튼 */}
      <div className="flex flex-col items-center gap-4 mb-16">
        <button
          onClick={handleCalculate}
          disabled={isCalculating || starts.length === 0 || ends.length === 0}
          className="w-full md:w-auto px-8 py-4 bg-primary text-white text-lg font-bold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transform transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-primary/30"
        >
          {isCalculating ? "경로 계산 중..." : "소요시간 비교하기 🚀"}
        </button>
        {error && <p className="text-red-500 font-medium">{error}</p>}
      </div>

      {/* 결과 테이블 */}
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">📊 소요시간 비교 결과</h2>
        <ResultTable starts={starts} ends={ends} matrixData={matrixData} isCalculating={isCalculating} />
      </section>
    </main>
  );
}
