"use client";

import { useEffect, useRef } from "react";

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
    // 광고가 이미 로드되었는지 확인하여 중복 로드 방지
    if (adClientId && insRef.current && !insRef.current.getAttribute("data-adsbygoogle-status")) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error("AdSense Error:", err);
      }
    }
  }, [adClientId]);

  if (!adClientId) {
    // 개발 환경 또는 클라이언트 ID 미설정 시 광고 영역 플레이스홀더 표시 (선택사항)
    if (process.env.NODE_ENV === "development") {
      return (
        <div className="w-full h-24 bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm rounded-lg my-4">
          Google AdSense Banner Area ({dataAdSlot})
        </div>
      );
    }
    return null;
  }

  return (
    <div className="w-full overflow-hidden flex justify-center my-4">
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block", minWidth: "250px", width: "100%" }}
        data-ad-client={adClientId}
        data-ad-slot={dataAdSlot}
        data-ad-format={dataAdFormat}
        data-full-width-responsive={dataFullWidthResponsive.toString()}
      />
    </div>
  );
}
