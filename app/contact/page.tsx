import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "./ContactForm";

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
            서비스 오류, 경로 데이터 문제, 개인정보 및 광고 관련 문의를 익명으로
            보낼 수 있습니다. 답변이 필요하면 이메일만 선택적으로 남겨주세요.
          </p>
        </header>

        <section className="space-y-8 text-foreground/80">
          <ContactForm />

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
