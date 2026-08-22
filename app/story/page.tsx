import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "모두스팟 이야기 | 원정 클라이머가 만든 약속 장소 비교 서비스",
  description:
    "원정 클라이머였던 개발자가 여러 클라이밍장과 친구들의 출발지를 대중교통 기준으로 비교하려고 모두스팟을 만들게 된 이야기를 소개합니다.",
  keywords: [
    "모두스팟 이야기",
    "모두스팟",
    "약속 장소 비교",
    "대중교통 거리비교",
    "클라이밍 약속 장소",
    "여러 출발지",
    "여러 목적지",
  ],
  alternates: {
    canonical: "/story",
  },
  openGraph: {
    title: "모두스팟 이야기 | 원정 클라이머가 만든 약속 장소 비교 서비스",
    description:
      "여러 후보지와 여러 출발지를 한눈에 비교하고 싶었던 불편함에서 모두스팟이 시작됐습니다.",
    url: "/story",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "모두스팟 이야기 | 원정 클라이머가 만든 약속 장소 비교 서비스",
    description:
      "대중교통으로 모두에게 공정한 약속 장소를 찾고 싶어 만든 모두스팟의 시작 이야기입니다.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  author: {
    "@type": "Person",
    name: "Eunji",
  },
  dateModified: "2026-05-06",
  datePublished: "2026-05-06",
  description: metadata.description,
  headline: "모두스팟 이야기: 원정 클라이머가 만든 약속 장소 비교 서비스",
  inLanguage: "ko-KR",
  mainEntityOfPage: "https://moduspot.vercel.app/story",
  publisher: {
    "@type": "Organization",
    logo: {
      "@type": "ImageObject",
      url: "https://moduspot.vercel.app/icon",
    },
    name: "모두스팟",
  },
};

const jsonLdText = JSON.stringify(jsonLd).replace(/</g, "\\u003c");

export default function StoryPage() {
  return (
    <main className="flex-1 w-full max-w-[960px] mx-auto p-6 md:p-10 mb-20 mt-4 md:mt-8 bg-surface rounded-3xl shadow-sm border border-border">
      <script type="application/ld+json">{jsonLdText}</script>
      <article className="prose prose-lg max-w-none">
        <header className="mb-10 border-b border-border pb-8">
          <p className="mb-3 text-sm font-semibold text-action">모두스팟 이야기</p>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-5 text-text leading-tight">
            원정 클라이머가 약속 장소 비교 서비스를 만들게 된 이유
          </h1>
          <p className="text-base md:text-lg text-text/65 leading-8">
            모두스팟은 거창한 기획서가 아니라 아주 현실적인 질문에서 시작됐습니다.
            “오늘 우리 모두에게 가장 부담 없는 장소는 어디일까?”라는 질문에 더 빨리,
            더 공정하게 답하고 싶었습니다.
          </p>
          <p className="mt-4 text-sm text-text/50">작성: Eunji · 마지막 업데이트: 2026년 5월 6일</p>
        </header>

        <section className="space-y-10 text-text/80">
          <div>
            <h2 className="text-2xl font-semibold text-text">시작은 클라이밍 약속이었습니다</h2>
            <p>
              저는 평소 클라이밍을 즐기는 이른바 원정 클라이머입니다. 한 곳의 홈 암장만
              다니기보다 전국의 다양한 암장을 돌아다니며 새로운 문제를 푸는 것을
              좋아합니다. 그런데 매번 약속을 잡을 때마다 같은 고민이 생겼습니다.
            </p>
            <p>
              “우리 집에서 대중교통으로 가장 빨리 갈 수 있는 암장은 어디일까?”
              말로는 간단한 질문이지만, 실제로 답을 찾으려면 후보 암장을 하나씩 검색하고
              이동 시간을 비교해야 했습니다.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-text">지도 앱으로는 한눈에 비교하기 어려웠습니다</h2>
            <p>
              국내 대표 지도 서비스들은 훌륭합니다. 하지만 제가 원한 방식과는 조금
              달랐습니다. 도착지를 한 곳만 찍어야 하거나, 여러 장소를 넣더라도 경유지처럼
              이어서 보는 흐름에 가까웠습니다.
            </p>
            <p>
              제가 필요했던 것은 “A, B, C 후보지 중 어디가 가장 가깝고, 얼마나 차이 나는지”를
              표로 바로 보는 일이었습니다. 특히 자가용이 없는 뚜벅이 개발자에게는
              대중교통 소요 시간을 일일이 검색해 메모장에 옮겨 적는 과정이 너무 번거로웠습니다.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-text">그래서 모두스팟을 만들었습니다</h2>
            <p>
              모두스팟은 처음에는 저를 위한 작은 도구였습니다. 여러 목적지 후보를 넣고,
              내 출발지에서 각각 얼마나 걸리는지 한눈에 보고 싶었습니다. 그런데 개발하다
              보니 혼자 운동하러 갈 때보다 친구와 함께 만날 때 더 큰 힘을 발휘한다는 것을
              알게 됐습니다.
            </p>
            <p>
              나에게만 가까운 장소가 아니라 친구와 나 모두에게 공평한 중간 위치를 찾는 것.
              바로 그 순간부터 모두스팟은 단순한 개인용 계산기가 아니라, 모두가 납득할 수
              있는 약속 장소를 고르는 서비스가 되었습니다.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-text">여러 출발지와 여러 목적지를 함께 비교합니다</h2>
            <p>
              모두스팟은 다중 출발지와 다중 목적지 후보를 지원합니다. 친구들의 집 주소나
              현재 위치를 출발지에 넣고, 오늘 가보고 싶은 클라이밍장이나 모임 장소 후보를
              목적지로 넣으면 각 조합의 대중교통 소요 시간을 계산합니다.
            </p>
            <ol className="space-y-3 pl-5">
              <li>친구들의 집 주소나 현재 위치를 모두 출발지에 등록합니다.</li>
              <li>오늘 가보고 싶은 클라이밍장이나 약속 장소 후보를 목적지에 넣습니다.</li>
              <li>버튼 하나로 사람별 소요 시간과 후보별 이동 부담을 비교합니다.</li>
              <li>가장 균형 잡힌 장소를 고르고 공유 링크로 함께 확인합니다.</li>
            </ol>
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-action/15 bg-action/5 p-6 md:p-8">
          <h2 className="mt-0 text-2xl font-semibold text-text">모두스팟이 줄이고 싶은 것</h2>
          <p className="text-text/75">
            우리는 약속 장소를 정하는 데 생각보다 많은 에너지를 씁니다. 누가 멀리 오는지,
            어느 후보가 공정한지, 결과를 어떻게 공유할지 고민하다 보면 정작 만나서 할
            이야기를 시작하기도 전에 지치곤 합니다. 모두스팟은 그 과정을 데이터로
            단순하게 만들고 싶습니다.
          </p>
        </section>

        <section className="mt-12 space-y-4 text-text/80">
          <h2 className="text-2xl font-semibold text-text">앞으로의 모두스팟</h2>
          <p>
            앞으로도 모두스팟은 클라이밍뿐만 아니라 친구 모임, 스터디, 회식, 데이트,
            동호회처럼 여러 사람이 만나는 모든 순간에 도움이 되는 약속 장소 비교 서비스가
            되고자 합니다. 감으로 정하던 장소를 데이터로 확인하고, 모두가 조금 더 편하게
            만날 수 있도록 계속 다듬어가겠습니다.
          </p>
        </section>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="inline-flex items-center justify-center rounded-xl bg-action px-6 py-3 text-sm font-semibold text-action-foreground hover:bg-action-hover transition-colors">
            모두스팟으로 장소 비교하기
          </Link>
          <Link href="/middle-point" className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold text-text hover:text-action transition-colors">
            중간지점 기준 보기
          </Link>
        </div>
      </article>
    </main>
  );
}
