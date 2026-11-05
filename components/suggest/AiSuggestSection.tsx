"use client";

import AiSuggestPanel from "@/components/suggest/AiSuggestPanel";
import { useSuggestCandidates } from "@/hooks/useSuggestCandidates";
import type { KakaoLocation } from "@/types/kakao";

export interface AiSuggestSectionProps {
  starts: KakaoLocation[];
  ends: KakaoLocation[];
  onAddEnd: (location: KakaoLocation) => void;
}

// /api/suggest 호출 상태를 가진 컨테이너. 화면은 AiSuggestPanel이 그린다.
export default function AiSuggestSection({ starts, ends, onAddEnd }: AiSuggestSectionProps) {
  const { status, candidates, error, suggest } = useSuggestCandidates();

  return (
    <AiSuggestPanel
      startCount={starts.length}
      ends={ends}
      status={status}
      candidates={candidates}
      error={error}
      onSuggest={(purpose) => suggest(starts, purpose)}
      onAddEnd={onAddEnd}
    />
  );
}
