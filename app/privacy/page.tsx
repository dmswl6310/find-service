import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 모두스팟",
  description: "모두스팟의 개인정보 수집 항목, 분석·광고 도구, 문의 처리, 보유 기간과 이용자 권리를 안내합니다.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <main className="flex-1 w-full max-w-[800px] mx-auto p-6 md:p-10 mb-20 mt-4 md:mt-8 bg-surface rounded-3xl shadow-sm border border-border">
      <article className="prose prose-lg max-w-none">
        <header className="mb-10 border-b border-border pb-8">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 text-text">
            개인정보처리방침
          </h1>
          <p className="text-sm text-text/50">
            마지막 업데이트: 2026년 5월 14일
          </p>
        </header>

        <section className="space-y-8 text-text/80">
          <div>
            <h2 className="text-xl font-semibold text-text mb-3">1. 개인정보의 처리 목적</h2>
            <p>
              모두스팟은 회원가입 없이 사용할 수 있는 약속 장소 비교 서비스입니다. 서비스 운영자는
              기능 제공, 오류 대응, 보안 유지, 서비스 품질 개선, 광고 운영을 위해 필요한 최소한의
              정보를 처리합니다. 처리 목적이 변경되는 경우에는 본 페이지를 통해 안내합니다.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>여러 출발지와 목적지 후보의 대중교통 비교 기능 제공</li>
              <li>사용자 경험 향상 및 서비스 최적화</li>
              <li>오류 제보, 문의, 개인정보 요청 처리</li>
              <li>신규 기능 개선 및 광고 운영</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-text mb-3">2. 처리하는 정보 항목</h2>
            <p>
              모두스팟은 별도의 회원 계정을 만들지 않으며 이름, 주소, 전화번호를 필수로
              수집하지 않습니다. 다만 서비스 이용 과정에서 아래 정보가 처리될 수 있습니다.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>장소 검색과 경로 계산을 위해 사용자가 입력한 출발지, 목적지 후보, 출발 날짜와 시간</li>
              <li>문의 폼에 사용자가 직접 입력한 닉네임, 이메일, 문의 내용</li>
              <li>서비스 접속 과정에서 자동 생성되는 IP 주소, 브라우저/기기 정보, 방문 일시, 쿠키, 사용 로그</li>
              <li>광고와 분석 도구가 생성하는 비식별 통계 정보</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-text mb-3">3. 구글 애드센스, 분석 도구 및 쿠키 사용</h2>
            <p>
              본 사이트는 서비스 운영과 광고 송출을 위해 Google AdSense, Google Analytics,
              Vercel Analytics를 사용할 수 있습니다. 이 과정에서 쿠키, 웹 비콘, IP 주소,
              브라우저 정보와 같은 식별자가 사용될 수 있습니다.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Google을 포함한 타사 공급업체는 쿠키를 사용하여 사용자가 본 웹사이트나 다른 웹사이트를 이전에 방문한 기록을 기반으로 광고를 게재합니다.</li>
              <li>Google은 광고 쿠키를 사용하여 사용자가 본 웹사이트나 인터넷의 다른 웹사이트를 방문한 기록을 기반으로 Google 및 파트너가 사용자에게 광고를 게재할 수 있도록 합니다.</li>
              <li>Google이 파트너 사이트에서 데이터를 사용하는 방식은 <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="text-action hover:underline">Google 안내 페이지</a>에서 확인할 수 있습니다.</li>
              <li>사용자는 <a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer" className="text-action hover:underline">광고 설정</a>에서 맞춤 광고를 관리할 수 있습니다.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-text mb-3">4. 개인정보의 처리 및 보유 기간</h2>
            <p>
              장소 검색과 경로 계산을 위해 입력한 정보는 결과 제공과 공유 URL 복원에 필요한 범위에서
              사용됩니다. 문의 폼으로 전달된 내용은 문의 처리와 악용 방지를 위해 필요한 기간 동안
              보관될 수 있으며, 처리 목적이 달성되면 합리적인 범위에서 삭제합니다. 서버 로그와 분석
              데이터는 보안, 장애 대응, 서비스 개선을 위해 일정 기간 보관될 수 있습니다.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-text mb-3">5. 이용자 및 법정대리인의 권리와 그 행사방법</h2>
            <p>
              모두스팟은 별도의 회원가입 기능을 제공하지 않으므로 사용자가 직접 등록한 계정 정보를
              보관하지 않습니다. 쿠키 정보는 웹 브라우저 설정에서 허용, 확인, 거부 또는 삭제할 수
              있습니다. 개인정보 열람, 정정, 삭제, 처리 정지 요청은 문의 페이지 또는 이메일로 요청할
              수 있습니다.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-text mb-3">6. 제3자 제공 및 처리 위탁</h2>
            <p>
              모두스팟은 서비스 제공을 위해 카카오 로컬 검색 API, ODSAY 대중교통 API, Google,
              Vercel 등 외부 서비스를 사용할 수 있습니다. 각 서비스는 자체 개인정보 처리방침에 따라
              정보를 처리할 수 있으며, 모두스팟은 서비스 목적에 필요한 범위에서만 외부 서비스를
              사용합니다.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-text mb-3">7. 개인정보 보호 문의</h2>
            <p>
              개인정보, 광고, 분석 도구, 문의 데이터 처리와 관련한 요청은 아래 연락처로 보낼 수 있습니다.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>운영자: Eunji</li>
              <li>이메일: <a href="mailto:dmswl6310@gmail.com" className="text-action hover:underline">dmswl6310@gmail.com</a></li>
              <li>문의 페이지: <Link href="/contact" className="text-action hover:underline">/contact</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-text mb-3">8. 기타</h2>
            <p>
              이 개인정보처리방침은 법령, 정책 또는 보안기술의 변경에 따라 내용이 추가, 삭제 및 수정될 수 있습니다. 변경 사항이 있는 경우 본 페이지를 통해 최신 내용을 안내합니다.
            </p>
          </div>
        </section>

        <div className="mt-12 text-center">
          <Link href="/" className="inline-flex items-center justify-center rounded-xl bg-canvas border border-border px-6 py-3 text-sm font-medium text-text hover:bg-surface hover:text-action transition-colors">
            메인 페이지로 돌아가기
          </Link>
        </div>
      </article>
    </main>
  );
}
