import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "문의 | 모두스팟",
  description:
    "모두스팟 서비스 오류, 데이터 문의, 개인정보 및 광고 관련 문의 방법을 안내합니다.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <main className="flex-1 w-full max-w-[820px] mx-auto p-6 md:p-10 mb-20 mt-4 md:mt-8 bg-surface rounded-3xl shadow-sm border border-border">
      <article className="prose prose-slate prose-lg max-w-none">
        <header className="mb-10 border-b border-border pb-8">
          <p className="mb-3 text-sm font-bold text-primary">Contact</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-foreground">
            문의하기
          </h1>
          <p className="text-foreground/65 leading-8">
            서비스 오류, 경로 데이터 문제, 개인정보 및 광고 관련 문의는 아래
            공식 저장소 이슈로 보내주세요. 재현 가능한 입력값이나 화면 캡처를 함께 보내면
            더 빠르게 확인할 수 있습니다.
          </p>
        </header>

        <section className="space-y-8 text-foreground/80">
          <div className="rounded-3xl border border-primary/15 bg-primary/5 p-6">
            <h2 className="mt-0 text-xl font-bold text-foreground">공식 문의 채널</h2>
            <p className="mb-2">
              <a href="https://github.com/dmswl6310" target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline">
                GitHub 프로필로 문의 채널 확인하기
              </a>
            </p>
            <p className="text-sm text-foreground/60">
              공개 저장소 이슈에 민감한 개인정보를 포함하지 마세요. 개인정보와
              관련된 상세 문의가 필요한 경우, 운영자가 별도 비공개 연락 수단을 안내합니다.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground">문의 시 포함하면 좋은 정보</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>사용한 출발지와 목적지 후보</li>
              <li>선택한 날짜와 시간</li>
              <li>오류 메시지 또는 문제가 발생한 화면</li>
              <li>브라우저와 기기 종류</li>
            </ul>
          </div>
        </section>

        <div className="mt-10">
          <Link href="/" className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-hover transition-colors">
            메인으로 돌아가기
          </Link>
        </div>
      </article>
    </main>
  );
}
