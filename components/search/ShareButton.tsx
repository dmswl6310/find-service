"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { encodeSharedLocations, writeSharedDepartureTimeParams } from "@/utils/shareUrl";

function copyTextWithFallback(text: string) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    return Promise.reject(new Error("Clipboard copy failed"));
  }

  return Promise.resolve();
}

export interface ShareButtonViewProps {
  canShare: boolean;
  copied?: boolean;
  copyFailed?: boolean;
  onShare: () => void;
}

export function ShareButtonView({
  canShare,
  copied = false,
  copyFailed = false,
  onShare,
}: ShareButtonViewProps) {
  return (
    <button
      type="button"
      onClick={onShare}
      disabled={!canShare}
      title={canShare ? "현재 입력한 출발지와 목적지 후보를 공유합니다." : "출발지와 목적지 후보를 모두 추가하면 공유할 수 있습니다."}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55"
      aria-live="polite"
    >
      <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      {!canShare ? "장소 추가 후 공유" : copyFailed ? "복사 실패, 다시 시도" : copied ? "링크 복사됨!" : "결과 공유 링크 복사"}
    </button>
  );
}

export default function ShareButton() {
  const { starts, ends, useDepartureTime, targetDate, targetTime } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const canShare = starts.length > 0 && ends.length > 0;

  const handleShare = () => {
    if (!canShare) return;

    const s = encodeSharedLocations(starts);
    const e = encodeSharedLocations(ends);

    const url = new URL(window.location.href);
    url.searchParams.set("s", s);
    url.searchParams.set("e", e);
    writeSharedDepartureTimeParams(url.searchParams, {
      enabled: useDepartureTime,
      date: targetDate,
      time: targetTime,
    });

    copyTextWithFallback(url.toString())
      .then(() => {
        setCopyFailed(false);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        setCopied(false);
        setCopyFailed(true);
      });
  };

  return (
    <ShareButtonView
      canShare={canShare}
      copied={copied}
      copyFailed={copyFailed}
      onShare={handleShare}
    />
  );
}
