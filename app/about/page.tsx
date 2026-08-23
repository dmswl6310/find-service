import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "서비스 소개 | 모두스팟",
  description:
    "모두스팟이 제공하는 대중교통 약속 장소 비교 기능, 운영 방식, 데이터 출처, 개인정보 처리 원칙을 소개합니다.",
  alternates: {
    canonical: "/about",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "서비스 소개 | 모두스팟",
  description: "모두스팟이 제공하는 대중교통 약속 장소 비교 기능, 운영 방식, 데이터 출처, 개인정보 처리 원칙을 소개합니다.",
  url: "https://moduspot.vercel.app/about",
  publisher: {
    "@type": "Organization",
    name: "모두스팟",
    logo: {
      "@type": "ImageObject",
      url: "https://moduspot.vercel.app/icon",
    },
  },
};

export default function AboutPage() {
  return (
    <main className="flex-1 w-full max-w-[900px] mx-auto p-6 md:p-10 mb-20 mt-4 md:mt-8 bg-surface rounded-3xl shadow-sm border border-border">
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <article className="prose prose-lg max-w-none">
        <header className="mb-10 border-b border-border pb-8">
          <p className="mb-3 text-sm font-semibold text-action">About</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 text-text">
            모두스팟은 공정한 약속 장소 선택을 돕는 대중교통 비교 서비스입니다.
          </h1>
          <p className="text-text/65 leading-8">
            서로 다른 지역에서 출발하는 사람들이 모일 때, 감으로만 장소를 정하면
            누군가에게 이동 부담이 쏠릴 수 있습니다. 모두스팟은 여러 출발지와
            목적지 후보를 한 번에 계산해 더 합리적인 선택을 돕습니다.
          </p>
        </header>

        <section className="space-y-8 text-text/80">
          <div>
            <h2 className="text-2xl font-semibold text-text">제공하는 기능</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>여러 출발지와 여러 목적지 후보의 대중교통 소요시간 비교</li>
              <li>출발 날짜와 시간 반영 옵션</li>
              <li>후보별 이동 결과 표와 지도 표시</li>
              <li>같은 비교 조건을 다시 열 수 있는 공유 URL 생성</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-text">데이터 출처</h2>
            <p>
              장소 검색에는 카카오 로컬 검색 API를, 대중교통 경로 계산에는 ODSAY
              대중교통 API를 사용합니다. 외부 API와 실제 교통 상황에 따라 결과가
              달라질 수 있으므로 최종 이동 전에는 각 교통수단의 운행 정보를 한 번
              더 확인하는 것을 권장합니다.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-text">운영 방식</h2>
            <p>
              모두스팟은 개인 개발자 Eunji가 운영하는 무료 웹 서비스입니다. 회원가입 없이
              사용할 수 있도록 만들었고, 약속 장소를 정할 때 반복되는 대중교통 검색을 줄이는
              데 초점을 맞추고 있습니다. 서비스 품질 개선을 위해 오류 제보와 개선 의견을
              문의 페이지에서 받고 있습니다.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-text">서비스의 한계</h2>
            <p>
              계산 결과는 외부 교통 데이터와 장소 검색 결과를 바탕으로 한 참고 정보입니다.
              실제 배차, 지연, 막차, 도보 접근성, 엘리베이터나 에스컬레이터 이용 가능 여부는
              현장 상황에 따라 달라질 수 있습니다. 중요한 일정에서는 최종 이동 전 공식 교통
              정보를 함께 확인해주세요.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-text">개인정보와 광고</h2>
            <p>
              모두스팟은 회원가입 없이 사용할 수 있으며, 이름이나 연락처를 직접
              입력받지 않습니다. 서비스 운영과 품질 개선을 위해 분석 도구와 광고
              서비스가 쿠키를 사용할 수 있으며 자세한 내용은 개인정보처리방침에
              정리되어 있습니다.
            </p>
            <p>
              광고는 무료 서비스 운영비를 충당하기 위한 수단이며, 본문을 가리거나 주요
              버튼 클릭을 방해하는 방식으로 배치하지 않는 것을 원칙으로 합니다.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-text">만들게 된 이야기</h2>
            <p>
              모두스팟은 여러 클라이밍장 후보를 대중교통으로 비교하고 싶었던 개인적인
              불편함에서 시작했습니다. 왜 이 서비스를 만들게 되었는지는
              <Link href="/story" className="font-semibold text-action hover:underline">
                {" "}모두스팟 이야기
              </Link>
              에 정리해두었습니다.
            </p>
          </div>
        </section>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/privacy" className="inline-flex items-center justify-center rounded-xl border border-border bg-canvas px-6 py-3 text-sm font-semibold text-text hover:text-action transition-colors">
            개인정보처리방침
          </Link>
          <Link href="/contact" className="inline-flex items-center justify-center rounded-xl bg-action px-6 py-3 text-sm font-semibold text-action-foreground hover:bg-action-hover transition-colors">
            문의하기
          </Link>
        </div>
      </article>
    </main>
  );
}
