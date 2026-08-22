import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import AdSenseScript from "@/components/ads/AdSenseScript";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import "./globals.css";

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://moduspot.vercel.app"
  ),
  title: "모두스팟 | 대중교통 약속 장소 비교",
  description:
    "여러 출발지와 목적지 후보의 대중교통 소요시간을 비교해 더 공정한 약속 장소를 고르는 서비스입니다.",
  keywords: [
    "모두스팟",
    "대중교통 경로 비교",
    "약속 장소 비교",
    "모임 장소 추천",
    "최적 경로 비교",
  ],
  openGraph: {
    title: "모두스팟 | 대중교통 약속 장소 비교",
    description:
      "여러 출발지와 목적지 후보의 대중교통 소요시간을 한눈에 비교해보세요.",
    url: "/",
    siteName: "모두스팟",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "모두스팟 - 여러 출발지와 목적지 후보의 대중교통 소요시간 비교",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "모두스팟 | 대중교통 약속 장소 비교",
    description:
      "여러 출발지와 목적지 후보의 대중교통 소요시간을 한눈에 비교해보세요.",
    images: ["/opengraph-image"],
  },
  verification: {
    google: "8YO-2rvhcMiS-9OOaivqlNOhJG67WGPPtRh6IbVq3rM",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <head>
        <AdSenseScript />
      </head>
      <body className="min-h-full flex flex-col bg-canvas text-text">
        <SiteHeader />
        {children}
        <SiteFooter />
        <Analytics />
        <GoogleAnalytics gaId="G-0H0N7H4EFN" />
      </body>
    </html>
  );
}
