"use client";

import { useId, useState } from "react";
import Button from "@/components/ui/Button";
import InlineNotice from "@/components/ui/InlineNotice";
import type { SuggestedCandidate, SuggestStatus } from "@/hooks/useSuggestCandidates";
import type { KakaoLocation } from "@/types/kakao";

export const PURPOSE_MAX_LENGTH = 100;
export const PURPOSE_EXAMPLES = ["4명 저녁 회식, 조용한 곳", "카페에서 오래 수다", "주말 데이트", "사람 많은 번화가"];

export interface AiSuggestPanelProps {
  startCount: number;
  ends: KakaoLocation[];
  status: SuggestStatus;
  candidates: SuggestedCandidate[];
  error: string | null;
  onSuggest: (purpose: string) => void;
  onAddEnd: (location: KakaoLocation) => void;
}

// 팝업 안의 내용만 그리는 컴포넌트. 요청 상태는 부모(AiSuggestSection)가 넘겨 준다.
export default function AiSuggestPanel({ startCount, ends, status, candidates, error, onSuggest, onAddEnd }: AiSuggestPanelProps) {
  const [purpose, setPurpose] = useState("");
  const inputId = useId();

  if (startCount < 2) {
    return (
      <InlineNotice tone="info" title="출발지를 2곳 이상 넣어 주세요">
        AI는 출발지 모두에게 공평한 역 중에서 후보를 골라요. 출발지를 추가한 뒤 다시 열어 주세요.
      </InlineNotice>
    );
  }

  const trimmed = purpose.trim();
  const isLoading = status === "loading";
  const addedIds = new Set(ends.map((end) => end.id));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-muted">
        모임 목적을 적으면 출발지 모두에게 공평한 역 중에서 3곳을 골라 드려요. 이미 넣은 목적지 근처는 빼고 찾아요.
      </p>

      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (trimmed && !isLoading) onSuggest(trimmed);
        }}
      >
        <label htmlFor={inputId} className="text-sm font-medium text-text">모임 목적</label>
        <input
          id={inputId}
          value={purpose}
          maxLength={PURPOSE_MAX_LENGTH}
          onChange={(event) => setPurpose(event.target.value)}
          placeholder="예: 4명 저녁 회식, 조용한 곳"
          className="min-h-11 rounded-lg border border-border-strong bg-surface px-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
        />
        <div className="flex flex-wrap gap-2" aria-label="목적 예시">
          {PURPOSE_EXAMPLES.map((example) => (
            <Button key={example} type="button" variant="secondary" size="sm" onClick={() => setPurpose(example)}>
              {example}
            </Button>
          ))}
        </div>
        <Button type="submit" disabled={!trimmed} isLoading={isLoading} className="w-full">
          {isLoading ? "후보 찾는 중..." : "AI로 후보 3곳 찾기"}
        </Button>
      </form>

      {status === "error" && error && (
        <InlineNotice tone="warning" title="추천을 불러오지 못했어요">{error}</InlineNotice>
      )}

      {status === "success" && (
        <ul className="flex flex-col gap-2" aria-label="AI 추천 후보">
          {candidates.map(({ station, reason }) => {
            const isAdded = addedIds.has(station.id);
            return (
              <li key={station.id} className="flex items-center justify-between gap-3 rounded-lg border border-candidate bg-candidate-soft p-3">
                <div className="min-w-0">
                  <p className="font-medium text-text">{station.place_name}</p>
                  <p className="text-sm text-text-muted">{reason}</p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isAdded}
                  onClick={() => onAddEnd(station)}
                  aria-label={isAdded ? `${station.place_name} 추가됨` : `${station.place_name} 후보에 추가`}
                >
                  {isAdded ? "추가됨" : "추가"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
