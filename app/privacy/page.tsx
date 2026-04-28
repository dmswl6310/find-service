import Link from "next/link";

export const metadata = {
  title: "개인정보처리방침 | 모두스팟",
  description: "모두스팟 서비스의 개인정보처리방침입니다.",
};

export default function PrivacyPage() {
  return (
    <main className="flex-1 w-full max-w-[800px] mx-auto p-6 md:p-10 mb-20 mt-4 md:mt-8 bg-surface rounded-3xl shadow-sm border border-border">
      <article className="prose prose-slate prose-lg max-w-none">
        <header className="mb-10 border-b border-border pb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-foreground">
            개인정보처리방침
          </h1>
          <p className="text-sm text-foreground/50">
            마지막 업데이트: 2026년 4월 28일
          </p>
        </header>

        <section className="space-y-8 text-foreground/80">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">1. 개인정보의 처리 목적</h2>
            <p>
              모두스팟은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 관련 법령에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>사용자 경험 향상 및 서비스 최적화</li>
              <li>신규 서비스 개발 및 맞춤형 광고 제공 (구글 애드센스 등)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">2. 구글 애드센스 및 쿠키 사용</h2>
            <p>
              본 사이트는 광고 송출을 위해 <strong>Google AdSense</strong>를 사용합니다.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Google을 포함한 타사 공급업체는 쿠키를 사용하여 사용자가 본 웹사이트나 다른 웹사이트를 이전에 방문한 기록을 기반으로 광고를 게재합니다.</li>
              <li>Google은 광고 쿠키를 사용하여 사용자가 본 웹사이트나 인터넷의 다른 웹사이트를 방문한 기록을 기반으로 Google 및 파트너가 사용자에게 광고를 게재할 수 있도록 합니다.</li>
              <li>사용자는 <a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">광고 설정</a>에 방문하여 맞춤 광고를 해제할 수 있습니다.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">3. 개인정보의 처리 및 보유 기간</h2>
            <p>
              본 사이트는 별도의 회원가입을 요구하지 않으며, 사용자의 이름, 연락처 등의 민감한 개인정보를 직접적으로 수집하거나 저장하지 않습니다. 단, 서비스 이용 과정에서 IP 주소, 쿠키, 방문 일시 등의 서비스 이용 기록이 자동으로 생성되어 수집될 수 있습니다.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">4. 이용자 및 법정대리인의 권리와 그 행사방법</h2>
            <p>
              모두스팟은 별도의 회원가입 기능을 제공하지 않으므로 사용자가 직접 등록한 계정 정보를 보관하지 않습니다. 서비스 이용 중 자동 생성되는 쿠키 정보는 웹 브라우저의 옵션을 설정하여 허용, 확인, 거부 또는 삭제할 수 있습니다. 개인정보 처리와 관련한 문의가 있는 경우 문의 페이지의 공식 채널을 통해 요청할 수 있습니다.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">5. 기타</h2>
            <p>
              이 개인정보처리방침은 법령, 정책 또는 보안기술의 변경에 따라 내용이 추가, 삭제 및 수정될 수 있습니다. 변경 사항이 있는 경우 본 페이지를 통해 최신 내용을 안내합니다.
            </p>
          </div>
        </section>

        <div className="mt-12 text-center">
          <Link href="/" className="inline-flex items-center justify-center rounded-xl bg-background border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-surface hover:text-primary transition-colors">
            메인 페이지로 돌아가기
          </Link>
        </div>
      </article>
    </main>
  );
}
