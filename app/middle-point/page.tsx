import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "중간지점 찾기 | 여러명 중간거리 약속 장소 비교",
  description:
    "여러명이 만날 때 지도상 가운데가 아니라 대중교통 이동시간 기준으로 중간지점과 중간거리를 비교하는 방법을 안내합니다.",
  keywords: ["중간지점", "중간거리", "중간 약속 장소", "여러명 거리비교", "약속 장소 추천"],
  alternates: {
    canonical: "/middle-point",
  },
  openGraph: {
    title: "중간지점 찾기 | 모두스팟",
    description:
      "여러 출발지의 대중교통 시간을 비교해 공정한 중간 약속 장소를 찾는 기준을 정리했습니다.",
    url: "/middle-point",
    type: "article",
  },
};

const faqItems = [
  {
    answer:
      "여러 출발지에서 후보 목적지까지 걸리는 대중교통 시간을 비교하고, 평균과 최장 이동시간이 함께 낮은 장소를 고르면 됩니다.",
    question: "여러명 중간지점은 어떻게 찾나요?",
  },
  {
    answer:
      "지도상 직선거리보다 실제 지하철·버스 이동시간을 기준으로 보는 것이 모임 장소를 정할 때 더 공정합니다.",
    question: "중간거리와 이동시간 중 무엇이 더 중요할까요?",
  },
  {
    answer:
      "중간 약속 장소 후보를 여러 개 넣고 각 사람의 소요시간 편차를 확인하면 한 사람에게만 부담이 몰리는 장소를 피할 수 있습니다.",
    question: "중간 약속 장소 후보가 여러 개일 때는 어떻게 비교하나요?",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
    name: item.question,
  })),
};

export default function MiddlePointPage() {
  return (
    <main className="flex-1 w-full max-w-[960px] mx-auto p-6 md:p-10 mb-20 mt-4 md:mt-8 bg-surface rounded-3xl shadow-sm border border-border">
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <article className="prose prose-slate prose-lg max-w-none">
        <header className="mb-10 border-b border-border pb-8">
          <p className="mb-3 text-sm font-bold text-primary">중간지점 찾기</p>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5 text-foreground leading-tight">
            여러명 중간지점과 중간거리, 어떻게 비교해야 할까요?
          </h1>
          <p className="text-base md:text-lg text-foreground/65 leading-8">
            중간 약속 장소를 고를 때 지도에서 딱 가운데인 지점만 보면 실제 이동 부담을
            놓치기 쉽습니다. 모두스팟은 여러 출발지에서 후보 목적지까지의 대중교통
            시간을 비교해 더 공정한 중간지점을 찾도록 돕습니다.
          </p>
        </header>

        <section className="space-y-10 text-foreground/80">
          <div>
            <h2 className="text-2xl font-bold text-foreground">중간지점은 직선거리가 아니라 이동시간 기준으로 봐야 합니다</h2>
            <p>
              같은 중간거리처럼 보여도 지하철 노선, 환승 횟수, 도보 구간에 따라 실제
              소요시간은 크게 달라집니다. 그래서 여러명 거리비교에서는 각 사람의
              출발지를 넣고 후보 장소별 대중교통 시간을 한 번에 비교하는 것이 좋습니다.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">좋은 중간 약속 장소의 기준</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>가장 오래 걸리는 사람의 이동시간이 과도하지 않은 곳</li>
              <li>평균 이동시간이 짧고 편차가 작은 곳</li>
              <li>환승과 도보 부담이 특정 사람에게 몰리지 않는 곳</li>
              <li>모임 시간대의 배차와 막차를 고려할 수 있는 곳</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">모두스팟으로 비교하는 방법</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>참석자들의 출발지를 여러 개 추가합니다.</li>
              <li>중간지점 후보가 될 역, 상권, 장소를 목적지 후보로 추가합니다.</li>
              <li>소요시간 비교 결과에서 평균과 최장 이동시간을 함께 봅니다.</li>
              <li>지도 위치와 상세 경로를 확인하고 공유 링크로 의견을 모읍니다.</li>
            </ol>
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-border bg-background/70 p-6 md:p-8">
          <h2 className="mt-0 text-2xl font-bold text-foreground">중간지점 찾기 FAQ</h2>
          <dl className="space-y-5 text-foreground/80">
            {faqItems.map((item) => (
              <div key={item.question}>
                <dt className="font-bold text-foreground">{item.question}</dt>
                <dd className="mt-1">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-hover transition-colors">
            중간지점 비교 시작하기
          </Link>
          <Link href="/multi-route" className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-6 py-3 text-sm font-bold text-foreground hover:text-primary transition-colors">
            다대다 비교 방법 보기
          </Link>
        </div>
      </article>
    </main>
  );
}
