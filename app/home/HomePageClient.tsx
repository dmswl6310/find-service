"use client";

import { Suspense } from "react";
import { useTransitMatrix } from "@/hooks/useTransitMatrix";
import ComparisonWorkspace from "./ComparisonWorkspace";
import RouteSync from "./RouteSync";

export default function HomePageClient() {
  const { matrixData, isCalculating, calculateMatrix, error, resetMatrix, calculationProgress } =
    useTransitMatrix();

  return (
    <main className="min-w-0 flex-1 overflow-x-clip">
      <Suspense fallback={<div className="p-8 text-center">로딩 중...</div>}>
        <RouteSync calculateMatrix={calculateMatrix} />
        <ComparisonWorkspace
          matrixData={matrixData}
          isCalculating={isCalculating}
          calculateMatrix={calculateMatrix}
          error={error}
          resetMatrix={resetMatrix}
          calculationProgress={calculationProgress}
        />
      </Suspense>
    </main>
  );
}
