import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "다대다 경로 비교 | 여러 출발지 여러 목적지 비교",
  description:
    "여러 출발지와 여러 목적지를 다대다로 계산해 후보별 대중교통 소요시간을 비교하고 공정한 약속 장소를 고르는 방법을 안내합니다.",
  keywords: ["다대다", "여러 출발지", "여러 목적지", "대중교통 경로 비교", "목적지 후보 비교"],
  alternates: {
    canonical: "/multi-route",
  },
  openGraph: {
    title: "다대다 경로 비교 | 모두스팟",
    description:
      "여러 출발지와 여러 목적지를 한 번에 비교해 후보 장소별 이동 부담을 확인하세요.",
    url: "/multi-route",
    type: "article",
  },
};

const faqItems = [
  {
    answer:
      "여러 출발지 각각에서 여러 목적지 후보까지의 모든 조합을 계산하는 방식입니다. 예를 들어 출발지 3개와 목적지 4개면 12개 경로를 비교합니다.",
    question: "다대다 경로 비교는 무엇인가요?",
  },
  {
    answer:
      "친구, 동료, 스터디원이 서로 다른 곳에서 출발하고 후보 장소도 여러 곳일 때 가장 공정한 약속 장소를 고르는 데 유용합니다.",
    question: "여러 출발지와 여러 목적지는 언제 비교해야 하나요?",
  },
  {
    answer:
      "각 후보지의 평균 이동시간, 가장 오래 걸리는 사람의 시간, 실패한 경로 여부를 함께 보면 됩니다.",
    question: "다대다 경로 비교 결과는 어떤 기준으로 보나요?",
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

export default function MultiRoutePage() {
  return (
    <main className="flex-1 w-full max-w-[960px] mx-auto p-6 md:p-10 mb-20 mt-4 md:mt-8 bg-surface rounded-3xl shadow-sm border border-border">
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <article className="prose prose-slate prose-lg max-w-none">
        <header className="mb-10 border-b border-border pb-8">
          <p className="mb-3 text-sm font-bold text-primary">다대다 경로 비교</p>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5 text-foreground leading-tight">
            여러 출발지와 여러 목적지를 다대다로 비교하는 방법
          </h1>
          <p className="text-base md:text-lg text-foreground/65 leading-8">
            참석자가 여러 명이고 후보 장소도 여러 곳이라면 한두 경로만 비교해서는
            공정한 결정을 하기 어렵습니다. 모두스팟은 여러 출발지와 여러 목적지의
            모든 조합을 계산해 다대다 거리비교 결과를 보여줍니다.
          </p>
        </header>

        <section className="space-y-10 text-foreground/80">
          <div>
            <h2 className="text-2xl font-bold text-foreground">다대다 비교가 필요한 상황</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>친구들이 강남, 홍대, 잠실처럼 서로 다른 지역에서 출발할 때</li>
              <li>후보 장소가 성수, 을지로, 신촌처럼 여러 곳일 때</li>
              <li>평균 이동시간뿐 아니라 가장 오래 걸리는 사람까지 고려해야 할 때</li>
              <li>출발 시간에 따라 대중교통 결과가 달라지는 모임을 준비할 때</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">결과표를 읽는 기준</h2>
            <p>
              행은 출발지, 열은 목적지 후보입니다. 각 칸의 이동시간을 보면 누가 어느
              후보 장소까지 얼마나 걸리는지 확인할 수 있습니다. 한 후보지의 모든 칸이
              지나치게 크지 않고, 최장 이동시간과 평균 이동시간이 낮을수록 여러명에게
              더 무리 없는 약속 장소가 됩니다.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">검색어별로 찾는 기능</h2>
            <dl className="space-y-4">
              <div>
                <dt className="font-bold text-foreground">여러 출발지</dt>
                <dd>참석자별 출발지를 여러 개 추가해 각 사람의 이동 부담을 비교합니다.</dd>
              </div>
              <div>
                <dt className="font-bold text-foreground">여러 목적지</dt>
                <dd>후보 장소를 여러 개 넣고 어떤 장소가 가장 균형 잡힌지 확인합니다.</dd>
              </div>
              <div>
                <dt className="font-bold text-foreground">다대다</dt>
                <dd>출발지 수 × 목적지 수만큼 모든 경로를 계산해 표로 비교합니다.</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-border bg-background/70 p-6 md:p-8">
          <h2 className="mt-0 text-2xl font-bold text-foreground">다대다 비교 FAQ</h2>
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
            다대다 비교 시작하기
          </Link>
          <Link href="/middle-point" className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-6 py-3 text-sm font-bold text-foreground hover:text-primary transition-colors">
            중간지점 기준 보기
          </Link>
        </div>
      </article>
    </main>
  );
}
