import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import AdSenseScript from "@/components/ads/AdSenseScript";
import {
  buildKakaoSdkScriptUrl,
  getKakaoJsApiKey,
} from "@/lib/external-config";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://moduspot.vercel.app"
  ),
  title: "모두스팟 | 여러 출발지와 목적지를 위한 최적의 경로 찾기",
  description:
    "여러 출발지와 목적지의 대중교통 소요시간을 한눈에 비교해보세요. 다중 출발지 최단거리, 대중교통 중간지점 찾기 서비스.",
  keywords: ["중간지점", "경로비교", "대중교통", "모임장소", "최적경로"],
  openGraph: {
    title: "모두스팟 | 최적의 약속장소 찾기",
    description:
      "여러 출발지와 목적지의 대중교통 소요시간을 한눈에 비교해보세요.",
    url: "/",
    siteName: "모두스팟",
    locale: "ko_KR",
    type: "website",
  },
  verification: {
    google: "HUSgzc9mTkH6R7bmdOrJmCaCwcnfOsjKEGnLcWjK5FA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} h-full antialiased`}>
      <head>
        <Script
          strategy="beforeInteractive"
          src={buildKakaoSdkScriptUrl(getKakaoJsApiKey())}
        />
        <AdSenseScript />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="border-b border-border bg-surface/80 backdrop-blur">
          <nav className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between md:px-8">
            <Link href="/" className="text-xl font-black tracking-tight text-foreground">
              모두스팟
            </Link>
            <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-foreground/70">
              <Link href="/" className="hover:text-primary transition-colors">
                경로 비교
              </Link>
              <Link href="/tips" className="hover:text-primary transition-colors">
                장소 선택 팁
              </Link>
              <Link href="/about" className="hover:text-primary transition-colors">
                서비스 소개
              </Link>
              <Link href="/contact" className="hover:text-primary transition-colors">
                문의
              </Link>
            </div>
          </nav>
        </header>
        {children}
        <footer className="w-full py-10 mt-auto border-t border-border bg-surface/50">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-foreground/60">
              <p>© {new Date().getFullYear()} 모두스팟. All rights reserved.</p>
              <div className="flex items-center gap-4 flex-wrap justify-center">
                <Link
                  href="/privacy"
                  className="hover:text-primary transition-colors"
                >
                  개인정보처리방침
                </Link>
                <span className="text-border">|</span>
                <Link
                  href="/terms"
                  className="hover:text-primary transition-colors"
                >
                  이용약관
                </Link>
                <span className="text-border">|</span>
                <Link
                  href="/tips"
                  className="hover:text-primary transition-colors font-medium"
                >
                  장소 선택 팁
                </Link>
                <span className="text-border">|</span>
                <Link
                  href="/about"
                  className="hover:text-primary transition-colors"
                >
                  서비스 소개
                </Link>
                <span className="text-border">|</span>
                <Link
                  href="/contact"
                  className="hover:text-primary transition-colors"
                >
                  문의
                </Link>
              </div>
            </div>
          </div>
        </footer>
        <Analytics />
        <GoogleAnalytics gaId="G-BX8G8SHB0Q" />
      </body>
    </html>
  );
}
