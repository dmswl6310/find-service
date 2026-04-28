import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "약속 장소 고르는 법 | 모두스팟",
  description:
    "여러 출발지가 있는 모임에서 공정한 약속 장소를 고르는 기준과 대중교통 소요시간 비교 방법을 정리했습니다.",
  alternates: {
    canonical: "/tips",
  },
  openGraph: {
    title: "약속 장소 고르는 법 | 모두스팟",
    description:
      "모임 장소를 정할 때 이동시간, 환승, 막차, 접근성을 함께 비교하는 실전 가이드입니다.",
    url: "/tips",
    type: "article",
  },
};

const checklist = [
  "모든 참석자의 출발지를 같은 기준으로 입력합니다.",
  "후보 장소는 역 이름만이 아니라 실제 만나는 건물·상권명까지 확인합니다.",
  "평균 시간만 보지 말고 가장 오래 걸리는 사람의 이동시간도 함께 봅니다.",
  "환승 횟수, 도보 구간, 막차 시간을 최종 결정 전에 다시 확인합니다.",
];

export default function TipsPage() {
  return (
    <main className="flex-1 w-full max-w-[960px] mx-auto p-6 md:p-10 mb-20 mt-4 md:mt-8 bg-surface rounded-3xl shadow-sm border border-border">
      <article className="prose prose-slate prose-lg max-w-none">
        <header className="mb-10 border-b border-border pb-8">
          <p className="mb-3 text-sm font-bold text-primary">모두스팟 활용 가이드</p>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5 text-foreground leading-tight">
            여러 출발지가 있을 때 약속 장소를 공정하게 고르는 방법
          </h1>
          <p className="text-base md:text-lg text-foreground/65 leading-8">
            모임 장소를 정할 때 한 사람에게만 이동 부담이 몰리면 약속 자체가
            피곤해집니다. 모두스팟은 출발지와 후보 목적지를 여러 개 넣고
            대중교통 소요시간을 비교해, 대화로 결정하기 어려운 부분을 숫자와
            지도로 확인할 수 있게 돕습니다.
          </p>
          <p className="mt-4 text-sm text-foreground/50">마지막 업데이트: 2026년 4월 28일</p>
        </header>

        <section className="mb-12 rounded-3xl border border-primary/15 bg-primary/5 p-6 md:p-8">
          <h2 className="mt-0 text-2xl font-bold text-foreground">빠른 체크리스트</h2>
          <ul className="mt-5 space-y-3 pl-0 list-none text-foreground/75">
            {checklist.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-10 text-foreground/80">
          <div>
            <h2 className="text-2xl font-bold text-foreground">1. 평균보다 편차를 먼저 봅니다</h2>
            <p>
              약속 장소를 고를 때 평균 이동시간만 보면 한 명이 과도하게 오래
              이동하는 상황을 놓치기 쉽습니다. 후보 장소별로 가장 오래 걸리는
              사람의 시간과 가장 짧게 걸리는 사람의 시간 차이를 함께 확인하면
              불균형한 장소를 빠르게 제외할 수 있습니다.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">2. 환승과 도보 부담도 결정 기준입니다</h2>
            <p>
              같은 45분이라도 환승 3번과 직통 45분은 체감 피로도가 다릅니다.
              대중교통 결과를 확인한 뒤에는 환승 횟수, 도보 이동 거리, 역에서
              목적지까지의 접근성을 함께 비교하세요. 비가 오거나 짐이 많은 날은
              도보 구간이 짧은 후보가 더 좋은 선택일 수 있습니다.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">3. 시간대를 실제 약속 시간에 맞춥니다</h2>
            <p>
              출근 시간, 퇴근 시간, 주말 저녁은 대중교통 배차와 혼잡도가 크게
              달라집니다. 모두스팟의 출발 시간 옵션을 켜고 실제 이동할 날짜와
              시간을 넣으면 현재 시각 기준보다 현실적인 비교가 가능합니다.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">4. 후보지는 3~5개 정도로 좁혀 비교합니다</h2>
            <p>
              후보가 너무 많으면 결과를 해석하기 어렵고, 너무 적으면 좋은 대안을
              놓칠 수 있습니다. 지하철 환승역, 주요 상권, 참석자들이 이미 알고
              있는 장소를 3~5개 정도 넣어 비교하면 빠르게 합의점을 찾기 좋습니다.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">5. 최종 결정 전에는 공유 링크로 함께 확인합니다</h2>
            <p>
              계산 결과를 공유하면 각자가 같은 출발지와 후보 장소를 기준으로
              판단할 수 있습니다. 이동시간 숫자만 캡처하는 것보다 공유 링크로
              조건을 함께 확인하면 오해가 줄고, 나중에 후보를 바꿔 다시 비교하기도
              쉽습니다.
            </p>
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-border bg-background/70 p-6 md:p-8">
          <h2 className="mt-0 text-2xl font-bold text-foreground">모두스팟을 이렇게 사용해보세요</h2>
          <ol className="space-y-3 pl-5 text-foreground/75">
            <li>참석자별 출발지를 모두 추가합니다.</li>
            <li>가능한 후보 장소를 목적지 후보에 추가합니다.</li>
            <li>필요하면 출발 시간 반영을 켭니다.</li>
            <li>소요시간 비교 결과에서 평균, 최대 이동시간, 지도 위치를 함께 봅니다.</li>
            <li>공유 버튼으로 결과를 보내고 최종 후보를 정합니다.</li>
          </ol>
        </section>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-hover transition-colors">
            경로 비교 시작하기
          </Link>
          <Link href="/about" className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-6 py-3 text-sm font-bold text-foreground hover:text-primary transition-colors">
            서비스 소개 보기
          </Link>
        </div>
      </article>
    </main>
  );
}
