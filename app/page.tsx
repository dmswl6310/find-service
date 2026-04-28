"use client";

import { Suspense } from "react";
import MainContent from "./home/MainContent";
import RouteSync from "./home/RouteSync";
import { useTransitMatrix } from "@/hooks/useTransitMatrix";

export default function Home() {
  const { matrixData, isCalculating, calculateMatrix, error } = useTransitMatrix();

  return (
    <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 sm:p-6 md:p-8 mb-20">
      <Suspense fallback={<div className="p-8 text-center">로딩 중...</div>}>
        <RouteSync calculateMatrix={calculateMatrix} />
        <MainContent
          matrixData={matrixData}
          isCalculating={isCalculating}
          calculateMatrix={calculateMatrix}
          error={error}
        />
      </Suspense>
    </main>
  );
}
