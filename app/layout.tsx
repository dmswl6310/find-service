import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react"
import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { buildKakaoSdkScriptUrl, getKakaoJsApiKey } from "@/lib/external-config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "모두비교 | 여러 출발지와 목적지를 위한 최적의 경로 찾기",
  description: "여러 출발지와 목적지의 대중교통 소요시간을 한눈에 비교해보세요.",
  verification:{
    google: "HUSgzc9mTkH6R7bmdOrJmCaCwcnfOsjKEGnLcWjK5FA"
  }
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
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Analytics />
        <GoogleAnalytics gaId="G-BX8G8SHB0Q" />
      </body>
    </html>
  );
}
