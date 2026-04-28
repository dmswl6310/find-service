import Link from "next/link";

export const metadata = {
  title: "이용약관 | 모두비교",
  description: "모두비교 서비스의 이용약관입니다.",
};

export default function TermsPage() {
  return (
    <main className="flex-1 w-full max-w-[800px] mx-auto p-6 md:p-10 mb-20 mt-4 md:mt-8 bg-surface rounded-3xl shadow-sm border border-border">
      <article className="prose prose-slate prose-lg max-w-none">
        <header className="mb-10 border-b border-border pb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-foreground">
            이용약관
          </h1>
          <p className="text-sm text-foreground/50">
            마지막 업데이트: {new Date().toLocaleDateString('ko-KR')}
          </p>
        </header>

        <section className="space-y-8 text-foreground/80">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">제1조 (목적)</h2>
            <p>
              본 약관은 '모두비교'(이하 "웹사이트"라 합니다)가 제공하는 제반 서비스의 이용과 관련하여 웹사이트와 이용자의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">제2조 (약관의 게시와 개정)</h2>
            <ul className="list-decimal pl-5 space-y-2">
              <li>웹사이트는 이 약관의 내용을 이용자가 쉽게 알 수 있도록 초기 화면에 게시합니다.</li>
              <li>웹사이트는 필요한 경우 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</li>
              <li>약관이 개정될 경우 웹사이트는 개정 약관의 적용 일자 및 개정 사유를 명시하여 현행 약관과 함께 공지합니다.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">제3조 (서비스의 제공)</h2>
            <p>
              웹사이트는 다음과 같은 서비스를 제공합니다.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>다중 출발지와 목적지 간의 대중교통 경로 비교 정보 제공</li>
              <li>경로 및 소요 시간 시각화 서비스</li>
              <li>기타 웹사이트가 정하는 서비스</li>
            </ul>
            <p className="mt-4 text-sm text-foreground/60 italic">
              * 제공되는 경로나 소요 시간 데이터는 외부 API(ODsay, 카카오 등)에 의존하므로, 실제 상황과 다를 수 있으며 웹사이트는 이에 대한 법적 책임을 지지 않습니다.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">제4조 (면책 조항)</h2>
            <ul className="list-decimal pl-5 space-y-2">
              <li>웹사이트는 천재지변, 서비스 점검, 외부 API 오류 등 불가항력적인 사유로 인해 서비스를 제공할 수 없는 경우 서비스 제공에 관한 책임이 면제됩니다.</li>
              <li>웹사이트는 이용자가 서비스에 게재한 정보, 자료, 사실의 신뢰도, 정확성 등의 내용에 관하여는 책임을 지지 않습니다.</li>
              <li>웹사이트는 이용자 간 또는 이용자와 제3자 상호간에 서비스를 매개로 하여 거래 등을 한 경우에는 책임이 면제됩니다.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">제5조 (기타)</h2>
            <p>
              본 약관에 명시되지 않은 사항은 관계 법령 및 상관례에 따릅니다.
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
