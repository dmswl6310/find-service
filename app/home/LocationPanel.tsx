"use client";

import type { ComponentType, ReactNode } from "react";
import LocationGroup from "@/components/location/LocationGroup";
import type { LocationSearchProps } from "@/components/location/LocationSearch";
import ShareButton from "@/components/search/ShareButton";
import TimeFilter from "@/components/search/TimeFilter";
import Button from "@/components/ui/Button";
import type { KakaoLocation } from "@/types/kakao";

export interface LocationPanelProps {
  starts: KakaoLocation[];
  ends: KakaoLocation[];
  selectedStartId?: string;
  selectedEndId?: string;
  isCalculating?: boolean;
  onAddStart: (location: KakaoLocation) => void;
  onAddEnd: (location: KakaoLocation) => void;
  onRemoveStart: (id: string) => void;
  onRemoveEnd: (id: string) => void;
  onSelectStart: (id: string) => void;
  onSelectEnd: (id: string) => void;
  onCalculate: () => void;
  SearchComponent?: ComponentType<LocationSearchProps>;
  controls?: {
    shareButton: ReactNode;
    timeFilter: ReactNode;
  };
}

export default function LocationPanel({
  starts,
  ends,
  selectedStartId,
  selectedEndId,
  isCalculating = false,
  onAddStart,
  onAddEnd,
  onRemoveStart,
  onRemoveEnd,
  onSelectStart,
  onSelectEnd,
  onCalculate,
  SearchComponent,
  controls,
}: LocationPanelProps) {
  const routeCount = starts.length * ends.length;
  const canCalculate = routeCount > 0;

  return (
    <section aria-label="장소 입력" className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-text">장소와 시간을 입력하세요</h1>
        {controls?.shareButton ?? <ShareButton />}
      </div>
      {controls?.timeFilter ?? <TimeFilter />}
      <div className="grid gap-5">
        <LocationGroup kind="origin" title="출발지" locations={starts} selectedId={selectedStartId} onSelectLocation={onSelectStart} onRemove={onRemoveStart} onAdd={onAddStart} SearchComponent={SearchComponent} />
        <LocationGroup kind="candidate" title="목적지 후보" locations={ends} selectedId={selectedEndId} onSelectLocation={onSelectEnd} onRemove={onRemoveEnd} onAdd={onAddEnd} SearchComponent={SearchComponent} />
      </div>
      <Button type="button" onClick={onCalculate} disabled={!canCalculate} isLoading={isCalculating} className="w-full">
        {isCalculating ? "경로 계산 중..." : canCalculate ? `${routeCount}개 경로 비교하기` : "장소를 추가해 주세요"}
      </Button>
    </section>
  );
}
