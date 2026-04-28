import type { Metadata } from "next";
import HomePageClient from "./home/HomePageClient";

export const metadata: Metadata = {
  title: "모두스팟 | 여러 출발지의 약속 장소와 대중교통 소요시간 비교",
  description:
    "친구·동료의 여러 출발지와 후보 목적지를 입력하면 대중교통 소요시간을 한 번에 비교해 공정한 약속 장소를 찾을 수 있습니다.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "모두스팟 | 약속 장소 대중교통 소요시간 비교",
    description:
      "여러 출발지와 목적지 후보의 대중교통 시간을 비교해 모두에게 무리 없는 만남 장소를 고르세요.",
    url: "/",
    type: "website",
  },
};

export default function Home() {
  return <HomePageClient />;
}
