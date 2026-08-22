"use client";

import LocationSearch from "@/components/location/LocationSearch";
import PlaceRow from "@/components/location/PlaceRow";
import type { KakaoLocation } from "@/types/kakao";

export interface LocationGroupProps {
  kind: "origin" | "candidate";
  title: string;
  locations: KakaoLocation[];
  selectedId?: string;
  onSelectLocation: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (location: KakaoLocation) => void;
}

export default function LocationGroup({ kind, title, locations, selectedId, onSelectLocation, onRemove, onAdd }: LocationGroupProps) {
  const isOrigin = kind === "origin";
  const emptyMessage = isOrigin ? "친구들이 출발하는 역이나 장소를 추가해 주세요." : "비교하고 싶은 약속 장소 후보를 추가해 주세요.";

  return (
    <section aria-labelledby={`${kind}-locations-heading`} className={`flex flex-col gap-4 rounded-3xl border p-5 ${isOrigin ? "border-origin bg-origin-soft" : "border-candidate bg-candidate-soft"}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={`${kind}-locations-heading`} className="text-xl font-bold text-text">{title}</h2>
        <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-text-muted">{locations.length}개</span>
      </div>
      <LocationSearch
        label={`${title} 검색`}
        placeholder={`${title} 추가`}
        helperText={isOrigin ? "예: 강남역, 홍대입구역, 회사 주소" : "예: 성수동, 종로3가역, 예약하려는 식당"}
        onSelect={onAdd}
      />
      <ul className="flex min-h-16 flex-col gap-2 rounded-2xl border border-dashed border-border bg-surface-raised p-3">
        {locations.map((location, index) => (
          <PlaceRow
            key={location.id}
            location={location}
            kind={kind}
            index={index}
            selected={selectedId === location.id}
            onSelect={() => onSelectLocation(location.id)}
            onRemove={() => onRemove(location.id)}
          />
        ))}
        {locations.length === 0 && <li className="py-2 text-sm text-text-muted">{emptyMessage}</li>}
      </ul>
    </section>
  );
}
