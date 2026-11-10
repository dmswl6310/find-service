"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KakaoLocation } from "@/types/kakao";

export interface SuggestedCandidate {
  reason: string;
  station: KakaoLocation;
}

export type SuggestStatus = "idle" | "loading" | "success" | "error";

export const SUGGEST_FALLBACK_MESSAGE = "AI 추천을 불러오지 못했어요. 목적지 후보를 직접 입력해 주세요.";
export const SUGGEST_RATE_LIMIT_MESSAGE = "AI 추천 요청이 많아요. 잠시 후 다시 시도하거나 목적지 후보를 직접 입력해 주세요.";
export const SUGGEST_NO_STATIONS_MESSAGE = "출발지 주변에서 추천할 역을 찾지 못했어요. 목적지 후보를 직접 입력해 주세요.";
export const SUGGEST_TIMEOUT_MESSAGE = "AI 응답이 늦어지고 있어요. 다시 시도하거나 목적지 후보를 직접 입력해 주세요.";

// 서버 응답 코드별로 사용자에게 보여 줄 안내 (모두 직접 입력으로 돌아갈 수 있게)
export function getSuggestErrorMessage(status: number): string {
  switch (status) {
    case 429:
      return SUGGEST_RATE_LIMIT_MESSAGE;
    case 503:
      return SUGGEST_NO_STATIONS_MESSAGE;
    case 504:
      return SUGGEST_TIMEOUT_MESSAGE;
    default:
      return SUGGEST_FALLBACK_MESSAGE;
  }
}

// /api/suggest 응답의 station에는 카카오 필드가 더 붙어 오므로, 앱에서 쓰는 필드만 남긴다.
// "용산역 경의중앙선" → "용산역"처럼 노선 이름은 떼서 보여 준다.
export function toCandidateLocation(station: KakaoLocation): KakaoLocation {
  const baseName = station.place_name.trim().split(/\s+/)[0] || station.place_name;
  return {
    id: station.id,
    place_name: baseName,
    address_name: station.address_name ?? "",
    road_address_name: station.road_address_name ?? "",
    x: station.x,
    y: station.y,
  };
}

function isSuggestResponse(data: unknown): data is { candidates: SuggestedCandidate[] } {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as { candidates?: unknown }).candidates)
  );
}

export function useSuggestCandidates() {
  const [status, setStatus] = useState<SuggestStatus>("idle");
  const [candidates, setCandidates] = useState<SuggestedCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const suggest = useCallback(async (starts: KakaoLocation[], purpose: string, ends: KakaoLocation[] = []) => {
    // 이전 요청이 아직 진행 중이면 취소하고 마지막 요청 결과만 보여 준다
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    setError(null);
    setCandidates([]);

    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          starts: starts.map((start) => ({ name: start.place_name, x: start.x, y: start.y })),
          purpose,
          // 이미 넣은 목적지 근처 역은 서버에서 추천 대상에서 뺀다
          ends: ends.map((end) => ({ x: end.x, y: end.y })),
        }),
        signal: controller.signal,
      });
      const data: unknown = await res.json().catch(() => null);

      if (!res.ok || !isSuggestResponse(data) || data.candidates.length === 0) {
        setStatus("error");
        setError(getSuggestErrorMessage(res.ok ? 502 : res.status));
        return;
      }

      setCandidates(data.candidates.map((c) => ({ reason: c.reason, station: toCandidateLocation(c.station) })));
      setStatus("success");
    } catch (e) {
      if (controller.signal.aborted) return;
      console.error(e);
      setStatus("error");
      setError(SUGGEST_FALLBACK_MESSAGE);
    }
  }, []);

  return { status, candidates, error, suggest };
}
