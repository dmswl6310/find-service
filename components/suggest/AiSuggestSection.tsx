"use client";

import { useEffect, useId, useRef, useState } from "react";
import AiSuggestPanel from "@/components/suggest/AiSuggestPanel";
import Button from "@/components/ui/Button";
import { useSuggestCandidates } from "@/hooks/useSuggestCandidates";
import type { KakaoLocation } from "@/types/kakao";

export interface AiSuggestSectionProps {
  starts: KakaoLocation[];
  ends: KakaoLocation[];
  onAddEnd: (location: KakaoLocation) => void;
}

// 목적지 후보 제목 옆 "AI로 찾기" 버튼 + 누르면 열리는 팝업(모바일은 아래 시트).
// 평소 화면은 건드리지 않고, 요청 상태는 팝업을 닫았다 열어도 유지한다.
export default function AiSuggestSection({ starts, ends, onAddEnd }: AiSuggestSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { status, candidates, error, suggest } = useSuggestCandidates();
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    // 닫으면 팝업을 열었던 버튼으로 포커스를 돌려준다
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      if (trigger?.isConnected) trigger.focus();
    };
  }, [isOpen]);

  return (
    <>
      <Button type="button" size="sm" onClick={() => setIsOpen(true)} aria-haspopup="dialog">
        ✨ AI로 찾기
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <div aria-hidden="true" className="fixed inset-0 bg-text/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-xl border border-border bg-surface shadow-xl sm:max-w-lg sm:rounded-xl"
          >
            <header className="flex items-center justify-between gap-4 border-b border-border p-5">
              <h2 id={titleId} className="text-xl font-semibold text-text">AI로 목적지 후보 찾기</h2>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="AI 후보 찾기 닫기"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-canvas hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
              >
                ✕
              </button>
            </header>
            <div className="overflow-y-auto p-5">
              <AiSuggestPanel
                startCount={starts.length}
                ends={ends}
                status={status}
                candidates={candidates}
                error={error}
                onSuggest={(purpose) => suggest(starts, purpose, ends)}
                onAddEnd={onAddEnd}
                onDone={() => setIsOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
