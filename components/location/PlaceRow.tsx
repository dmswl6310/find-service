"use client";

import IconButton from "@/components/ui/IconButton";
import type { KakaoLocation } from "@/types/kakao";

export interface PlaceRowProps {
  location: KakaoLocation;
  kind: "origin" | "candidate";
  index: number;
  selected?: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

function placeMarker(kind: PlaceRowProps["kind"], index: number) {
  return kind === "origin" ? String(index + 1) : String.fromCharCode(65 + index);
}

export default function PlaceRow({ location, kind, index, selected = false, onSelect, onRemove }: PlaceRowProps) {
  const markerClass = kind === "origin" ? "rounded-full bg-origin text-action-foreground" : "rounded bg-candidate text-action-foreground";

  return (
    <li className={`flex items-center gap-2 rounded-xl border p-2 ${selected ? "border-border-strong bg-canvas" : "border-border bg-surface"}`}>
      <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center text-xs font-bold ${markerClass}`} aria-hidden="true">
        {placeMarker(kind, index)}
      </span>
      <button
        type="button"
        onClick={onSelect}
        aria-label={`${location.place_name} 선택`}
        aria-pressed={selected}
        className="min-w-0 flex-1 text-left"
      >
        <p className="truncate text-sm font-semibold text-text">{location.place_name}</p>
        <p className="truncate text-xs text-text-muted">{location.road_address_name || location.address_name}</p>
      </button>
      <IconButton aria-label={`${location.place_name} 제거`} type="button" variant="ghost" size="sm" onClick={onRemove}>
        <span aria-hidden="true">×</span>
      </IconButton>
    </li>
  );
}
