"use client";

import { Suspense } from "react";
import { useTransitMatrix } from "@/hooks/useTransitMatrix";
import MainContent from "./MainContent";
import RouteSync from "./RouteSync";

export default function HomePageClient() {
  const { matrixData, isCalculating, calculateMatrix, error, resetMatrix, calculationProgress } =
    useTransitMatrix();

  return (
    <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 sm:p-6 md:p-8 mb-20">
      <Suspense fallback={<div className="p-8 text-center">로딩 중...</div>}>
        <RouteSync calculateMatrix={calculateMatrix} />
        <MainContent
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
