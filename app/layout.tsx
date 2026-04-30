import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import AdSenseScript from "@/components/ads/AdSenseScript";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
    <html lang="ko" className={`${inter.variable} h-full antialiased`}>
      <head>
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
              <Link href="/middle-point" className="hover:text-primary transition-colors">
                중간지점 찾기
              </Link>
              <Link href="/multi-route" className="hover:text-primary transition-colors">
                다대다 비교
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
              <p>© {new Date().getFullYear()} 모두스팟. Made by Eunji.</p>
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
                  href="/middle-point"
                  className="hover:text-primary transition-colors"
                >
                  중간지점 찾기
                </Link>
                <span className="text-border">|</span>
                <Link
                  href="/multi-route"
                  className="hover:text-primary transition-colors"
                >
                  다대다 비교
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
        <GoogleAnalytics gaId="G-0H0N7H4EFN" />
      </body>
    </html>
  );
}
