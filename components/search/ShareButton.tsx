"use client";

import { useAppStore } from "@/store/useAppStore";
import { useState } from "react";

export default function ShareButton() {
  const { starts, ends } = useAppStore();
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    // 직렬화를 위해 최소한의 데이터만 사용 (이름,x,y,id)
    const encodeLocations = (locs: any[]) => {
      const minimal = locs.map((l) => ({ id: l.id, p: l.place_name, x: l.x, y: l.y }));
      return encodeURIComponent(btoa(JSON.stringify(minimal)));
    };

    const s = encodeLocations(starts);
    const e = encodeLocations(ends);

    const url = new URL(window.location.href);
    url.searchParams.set("s", s);
    url.searchParams.set("e", e);

    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (starts.length === 0 && ends.length === 0) return null;

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground font-medium rounded-xl hover:bg-secondary/80 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      {copied ? "링크 복사됨!" : "결과 공유 링크 복사"}
    </button>
  );
}
