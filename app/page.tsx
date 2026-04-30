import type { Metadata } from "next";
import HomePageClient from "./home/HomePageClient";

export const metadata: Metadata = {
  title: "모두스팟 | 여러명 중간지점·중간거리 약속 장소 비교",
  description:
    "여러명 거리비교가 필요할 때 여러 출발지와 여러 목적지를 다대다로 계산해 중간지점, 중간거리, 중간 약속 장소를 대중교통 기준으로 비교합니다.",
  keywords: [
    "여러명 거리비교",
    "중간지점",
    "중간거리",
    "중간 약속 장소",
    "여러 출발지",
    "여러 목적지",
    "다대다",
    "약속 장소 추천",
    "대중교통 거리비교",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "모두스팟 | 여러명 중간지점·중간거리 약속 장소 비교",
    description:
      "여러 출발지와 여러 목적지 후보를 다대다로 계산해 공정한 중간 약속 장소를 고르세요.",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "모두스팟 | 여러명 중간지점·중간거리 약속 장소 비교",
    description:
      "여러 출발지와 여러 목적지 후보를 다대다로 계산해 공정한 중간 약속 장소를 고르세요.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  applicationCategory: "TravelApplication",
  description: metadata.description,
  featureList: [
    "여러 출발지와 목적지 후보 다대다 비교",
    "대중교통 소요시간과 요금 비교",
    "황금 밸런스 목적지 추천",
    "공유 URL 생성과 복원",
  ],
  inLanguage: "ko-KR",
  name: "모두스팟",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "KRW",
  },
  url: "https://moduspot.vercel.app",
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <HomePageClient />
    </>
  );
}
