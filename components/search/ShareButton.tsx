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

export default function ShareButton() {
  const { starts, ends, useDepartureTime, targetDate, targetTime } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const handleShare = () => {
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

  if (starts.length === 0 && ends.length === 0) return null;

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground font-medium rounded-xl hover:bg-secondary/80 transition-colors"
      aria-live="polite"
    >
      <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      {copyFailed ? "복사 실패, 다시 시도" : copied ? "링크 복사됨!" : "결과 공유 링크 복사"}
    </button>
  );
}
