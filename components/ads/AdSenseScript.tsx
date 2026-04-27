import Script from "next/script";

export default function AdSenseScript() {
  const adClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  // 클라이언트 ID가 없으면 스크립트를 로드하지 않음 (개발 환경 또는 미설정 시)
  if (!adClientId) {
    return null;
  }

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClientId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
