"use client";

import type { OdsaySubPath, TransitFetchResult } from "@/types/odsay";
import { formatTime } from "@/utils/formatTime";
import { useEffect, useId, useRef } from "react";

export type RouteDetailSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  result: TransitFetchResult | null;
  startName: string;
  endName: string;
};

const segmentPresentation = {
  1: { label: "지하철", classes: "border-info bg-origin-soft text-info" },
  2: { label: "버스", classes: "border-success bg-surface-raised text-success" },
  3: { label: "도보", classes: "border-border bg-canvas text-text-muted" },
} as const;

function getSegmentPresentation(trafficType: number) {
  return segmentPresentation[trafficType as keyof typeof segmentPresentation] ?? {
    label: "이동",
    classes: "border-border bg-surface-raised text-text-muted",
  };
}

function getLineName(path: OdsaySubPath) {
  if (path.trafficType === 1) return path.lane?.[0]?.name || "지하철 노선";
  if (path.trafficType === 2) {
    const busNumber = path.lane?.[0]?.busNo;
    return busNumber ? `${busNumber}번 버스` : "버스 노선";
  }
  return "도보 이동";
}

export default function RouteDetailSheet({
  isOpen,
  onClose,
  result,
  startName,
  endName,
}: RouteDetailSheetProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isVisible = isOpen && result !== null;

  useEffect(() => {
    if (!isVisible) return;

    const previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      if (previouslyFocusedElement?.isConnected) previouslyFocusedElement.focus();
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [contenteditable="true"], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, onClose]);

  if (!isVisible || !result) return null;

  const isFailure = Boolean(result.error || result.timeMn < 0);
  const description = isFailure
    ? "경로 조회 실패 상세"
    : `총 ${result.timeMn}분, 환승 ${result.transitCount ?? 0}회, 요금 ${result.payment > 0 ? `${result.payment.toLocaleString()}원` : "무료"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-text/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="relative z-10 flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-xl border border-border bg-surface shadow-xl sm:max-w-xl sm:rounded-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border bg-surface p-5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-xl font-semibold text-text">
              {startName}에서 {endName}까지 상세 경로
            </h2>
            <p id={descriptionId} className="mt-1 text-sm text-text-muted">{description}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="상세 경로 닫기"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-canvas hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
              <path d="M6 6l12 12M18 6 6 18" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {isFailure ? (
            <section role="alert" className="m-5 rounded-lg border border-danger bg-surface-raised p-4">
              <h3 className="font-semibold text-danger">{result.errorMessage || "경로 조회 실패"}</h3>
              <dl className="mt-3 grid gap-2 text-sm text-text-muted">
                {result.errorCode ? <div><dt className="inline font-medium text-text">오류 코드: </dt><dd className="inline">{result.errorCode}</dd></div> : null}
                {result.errorStatus ? <div><dt className="inline font-medium text-text">응답 상태: </dt><dd className="inline">{result.errorStatus}</dd></div> : null}
                {result.errorDetails ? <div><dt className="inline font-medium text-text">상세 사유: </dt><dd className="inline">{result.errorDetails}</dd></div> : null}
              </dl>
            </section>
          ) : (
            <>
              <section aria-label="경로 요약" className="grid grid-cols-2 gap-4 border-b border-border bg-surface-raised p-5">
                <div>
                  <p className="text-xs text-text-muted">소요 시간 · 환승</p>
                  <p className="mt-1 text-xl font-semibold text-action">
                    {formatTime(result.timeMn)}
                    <span className="ml-2 text-sm font-medium text-text-muted">환승 {result.transitCount ?? 0}회</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">총 요금</p>
                  <p className="mt-1 text-lg font-semibold text-text">
                    {result.payment > 0 ? `${result.payment.toLocaleString()}원` : "무료"}
                  </p>
                </div>
              </section>

              <div className="p-5">
                {!result.subPath || result.subPath.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border bg-surface-raised p-4 text-center text-sm text-text-muted">
                    상세 경로 정보가 없습니다.
                  </p>
                ) : (
                  <ol className="space-y-3" aria-label="이동 구간">
                    {result.subPath.map((path, index) => {
                      const presentation = getSegmentPresentation(path.trafficType);
                      return (
                        <li key={`${path.trafficType}-${index}`} className="rounded-lg border border-border bg-surface p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${presentation.classes}`}>
                              {presentation.label}
                            </span>
                            <span className="text-sm font-semibold text-text">{getLineName(path)}</span>
                            <span className="text-sm text-text-muted">{path.sectionTime}분</span>
                          </div>
                          {path.trafficType === 3 ? (
                            <p className="mt-2 text-sm text-text-muted">
                              {path.distance > 0 ? `${path.distance.toLocaleString()}m 이동` : "도보 이동"}
                            </p>
                          ) : (
                            <div className="mt-3 text-sm text-text-muted">
                              <p><span className="font-medium text-text">{path.startName || "승차 지점"}</span> 승차</p>
                              <p className="my-1">{path.stationCount ?? 0}개 정류장 이동</p>
                              <p><span className="font-medium text-text">{path.endName || "하차 지점"}</span> 하차</p>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
