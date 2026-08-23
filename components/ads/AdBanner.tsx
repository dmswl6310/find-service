"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

interface AdBannerProps {
  dataAdSlot: string;
  dataAdFormat?: string;
  dataFullWidthResponsive?: boolean;
}

export default function AdBanner({
  dataAdSlot,
  dataAdFormat = "auto",
  dataFullWidthResponsive = true,
}: AdBannerProps) {
  const adClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (adClientId && insRef.current && !insRef.current.getAttribute("data-adsbygoogle-status")) {
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
      } catch (err) {
        console.error("AdSense Error:", err);
      }
    }
  }, [adClientId]);

  if (!adClientId) {
    if (process.env.NODE_ENV === "development") {
      return (
        <div className="my-4 flex h-24 w-full items-center justify-center rounded-lg border border-dashed border-border bg-canvas text-sm text-text-muted">
          Google AdSense Banner Area ({dataAdSlot})
        </div>
      );
    }
    return null;
  }

  return (
    <aside className="w-full overflow-hidden flex justify-center my-4" aria-label="광고 영역">
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block", minWidth: "250px", width: "100%" }}
        data-ad-client={adClientId}
        data-ad-slot={dataAdSlot}
        data-ad-format={dataAdFormat}
        data-full-width-responsive={dataFullWidthResponsive.toString()}
      />
    </aside>
  );
}
