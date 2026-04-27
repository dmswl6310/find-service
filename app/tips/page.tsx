import AdBanner from "@/components/ads/AdBanner";
import Link from "next/link";

export const metadata = {
  title: "고품질 사이트를 만들기 위한 도움말 가이드 | 모두비교",
  description: "웹사이트에서 고품질 콘텐츠를 마련하고 최상의 사용자 환경을 제공하는 방법 및 애드센스 수익 창출에 가장 적합한 사이트 유형에 대한 심층 가이드입니다.",
  openGraph: {
    title: "고품질 사이트를 만들기 위한 도움말 가이드 | 모두비교",
    description: "웹사이트에서 고품질 콘텐츠를 마련하고 최상의 사용자 환경을 제공하는 방법 및 애드센스 수익 창출에 가장 적합한 사이트 유형에 대한 심층 가이드입니다.",
    type: "article",
  }
};

export default function TipsPage() {
  return (
    <main className="flex-1 w-full max-w-[900px] mx-auto p-6 md:p-10 mb-20 mt-4 md:mt-8 bg-surface rounded-3xl shadow-sm border border-border">
      <article className="prose prose-slate prose-lg max-w-none">
        {/* Header Section */}
        <header className="mb-10 text-center border-b border-border pb-10">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 text-foreground leading-tight">
            구글 애드센스 공식: <br className="hidden md:block"/>
            <span className="text-primary">고품질 사이트를 만들기 위한 도움말</span> 종합 가이드
          </h1>
          <p className="text-base md:text-lg text-foreground/60 mb-6 max-w-2xl mx-auto">
            사용자에게 유용한 정보를 제공하고 사이트의 가치를 높이는 방법. 애드센스 팀이 제안하는 최상의 사용자 환경 구축 노하우를 확인하세요.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm font-medium text-foreground/50">
            <span>작성자: 구글 애드센스 정책 팀</span>
            <span>•</span>
            <span>최종 업데이트: 2012년 9월</span>
          </div>
        </header>

        {/* 상단 광고 */}
        <div className="my-8 rounded-2xl overflow-hidden bg-background/50 border border-border p-2">
          <AdBanner dataAdSlot="top-banner-slot" />
        </div>

        {/* Table of Contents */}
        <div className="bg-sky-500/[0.03] border border-sky-500/10 rounded-2xl p-6 md:p-8 mb-12">
          <h2 className="text-xl font-bold mt-0 mb-4 flex items-center gap-2 text-sky-900">
            <span>📑</span> 목차
          </h2>
          <ul className="list-none pl-0 space-y-3 m-0 text-sky-800/80 font-medium">
            <li><a href="#part1" className="no-underline hover:text-sky-600 hover:underline transition-colors">1부: 웹사이트 콘텐츠 효과적으로 설계하기</a></li>
            <li><a href="#part2" className="no-underline hover:text-sky-600 hover:underline transition-colors">2부: 수익 창출에 적합한 페이지 구축 전략</a></li>
            <li><a href="#conclusion" className="no-underline hover:text-sky-600 hover:underline transition-colors">결론 및 참고 자료</a></li>
          </ul>
        </div>

        {/* Part 1 */}
        <section id="part1" className="scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground border-l-4 border-primary pl-4 mb-8">
            1부: 웹사이트 콘텐츠 효과적으로 설계하기
          </h2>
          <p className="text-foreground/80 leading-relaxed mb-6 text-lg">
            많은 게시자들이 애드센스를 사용하여 비즈니스를 더욱 발전시키는 데 도움이 되는 권장사항에 대해 문의해 오고 있습니다. 이 질문에 정답이 있는 것은 아니지만, <strong>웹사이트에서 고품질 콘텐츠를 마련하고 최상의 사용자 환경을 제공</strong>하는데 집중하라는 것이 애드센스 팀의 변함없는 조언입니다. 다음은 사이트 전반의 품질을 높일 수 있도록 웹사이트 콘텐츠를 효과적으로 설계하고 구성하는 방법에 대한 몇 가지 제안 사항입니다.
          </p>

          <h3 className="text-xl md:text-2xl font-bold mt-10 mb-4 text-foreground/90">
            1. 내용이 중복되는 페이지 또는 사이트를 여러 개 만들지 마세요.
          </h3>
          <p className="text-foreground/80 leading-relaxed mb-6">
            사이트 콘텐츠는 양을 늘리는 것보다 품질을 높이는 것이 더 좋습니다. <strong>하나의 사이트에 집중하여 풍부한 정보와 독창적인 콘텐츠를 제공</strong>하면 사용자는 물론 사이트 게시자에게도 이익이 됩니다. 사용자들은 인터넷을 검색할 때 내용이 지나치게 일반적이거나 중복되는 여러 페이지나 하위 도메인, 사이트 등을 끊임없이 찾아 헤매는 일 없이 빠르고 쉽게 원하는 콘텐츠를 찾고 싶어합니다. 콘텐츠 또는 템플릿 디자인이 유사한 페이지나 사이트가 여러 개 있을 경우 하나로 통합해 보세요.
          </p>

          <h3 className="text-xl md:text-2xl font-bold mt-10 mb-4 text-foreground/90">
            2. 사용자들이 찾아올 수밖에 없고, 다시 사이트를 찾고 싶게 만드는 콘텐츠를 제공하세요.
          </h3>
          <p className="text-foreground/80 leading-relaxed mb-6">
            사이트에 콘텐츠를 만들 때는 유사한 주제를 다루는 다른 사이트와 차별화된 가치 또는 서비스를 제공하는지 스스로 자문해 보는 것이 중요합니다. 다른 사이트와 차별화되는 독창적인 콘텐츠를 만들면 그만큼의 보상이 주어집니다. <strong>유용한 검색결과를 제공하게 되므로 방문자가 다시 사이트를 방문</strong>하게 되는 것입니다.
          </p>

          <h3 className="text-xl md:text-2xl font-bold mt-10 mb-4 text-foreground/90">
            3. 약속한 대로 정보 또는 서비스를 제공하세요.
          </h3>
          <p className="text-foreground/80 leading-relaxed mb-8">
            일부 게시자는 사이트에서 제품이나 서비스를 제공하는 것처럼 속인 후 여러 페이지를 탐색하도록 만들어 광고 노출수를 올리기도 합니다. 이는 결과적으로 사용자의 만족도에 부정적인 영향을 주고 신뢰할 수 없는 사이트라는 인상을 심어주게 됩니다. 콘텐츠에 맞는 적절한 키워드를 사용하고 제공되는 제품 및 서비스를 쉽게 찾을 수 있도록 <strong>탐색하기 쉽게 사이트를 구성</strong>해야 합니다.
          </p>
        </section>

        {/* 중간 광고 */}
        <div className="my-12 rounded-2xl overflow-hidden bg-background/50 border border-border p-2">
          <AdBanner dataAdSlot="middle-banner-slot" />
        </div>

        {/* Part 2 */}
        <section id="part2" className="scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground border-l-4 border-emerald-500 pl-4 mb-8">
            2부: 수익 창출에 적합한 페이지 구축 전략
          </h2>
          <p className="text-foreground/80 leading-relaxed mb-6 text-lg">
            Google 디스플레이 네트워크의 목표는 사용자와 광고주에게 <strong>유용하고 관련성 높은 콘텐츠를 제공</strong>하는 것입니다. 앞서 애드센스에 적합하도록 고품질 사이트를 만들기 위한 도움말을 전해 드린 바 있습니다. 오늘은 여기서 더 나아가 수익 창출에 가장 적합한 사이트 및 페이지 유형은 어떤 것인지 말씀드리고자 합니다.
          </p>

          <h3 className="text-xl md:text-2xl font-bold mt-10 mb-4 text-foreground/90">
            1. 독창적인 콘텐츠를 제공하고 부가 가치를 창출하는 페이지
          </h3>
          <p className="text-foreground/80 leading-relaxed mb-6">
            Google 웹마스터 가이드라인에서는 사이트를 차별화하는 독창적인 콘텐츠를 제공하는 것의 중요성을 강조하고 있습니다. 그러나 이것은 고품질 웹사이트를 만들기 위한 여러 요건 중 하나에 불과합니다. Google 가이드라인은 도어웨이 페이지 및 도어웨이 도메인, 콘텐츠가 거의 또는 아예 없는 페이지, 특정 키워드 또는 구문에 최적화된 페이지 등도 사용하지 말 것을 권장하고 있습니다.
          </p>

          <h3 className="text-xl md:text-2xl font-bold mt-10 mb-4 text-foreground/90">
            2. 체계적인 구조로 풍부한 정보를 제공하는 콘텐츠 제작
          </h3>
          <p className="text-foreground/80 leading-relaxed mb-4">
            독창적인 콘텐츠를 제공하는 것은 고품질 웹사이트를 만들기 위한 여러 요건 중 하나에 불과합니다. <strong>콘텐츠는 유익하고 사용자가 탐색하기 쉬운 방식으로 구성</strong>되어야 합니다. 다음은 대표적으로 유의해야 할 사항 몇 가지입니다.
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-6 text-foreground/80 bg-background/50 p-6 rounded-2xl border border-border">
            <li>자신이 잘 알고 열중할 수 있는 주제에 초점을 맞추세요.</li>
            <li>여러 페이지에 동일한 콘텐츠를 게시하거나 중복 또는 불필요한 콘텐츠를 제작하지 마세요.</li>
            <li>관련성은 없지만 수익성이 좋은 키워드를 사용하는 등의 방법으로 Google 봇을 속이는 콘텐츠를 제작하기보다 사용자의 관심을 유도하는 데 집중해야 합니다. 즉 사용자의 관심사를 바탕으로 관련성 높은 정보를 다루는 양방향 경험을 제공할 수 있도록 하세요.</li>
          </ul>

          <p className="text-foreground/80 leading-relaxed mb-6">
            사이트의 구성과 탐색 구조도 중요합니다. 사용자가 쉽게 페이지를 탐색하고 원하는 정보나 서비스를 찾을 수 있도록 하세요. 또한, <strong>광고 구현과 페이지 콘텐츠 사이의 균형</strong>을 항상 잘 맞춰야 합니다. 광고는 사용자에게 추가적인 자료로서 제공되고 페이지의 가치를 높여야 하며, 과도하게 게재되거나 콘텐츠 자체보다 더 눈에 잘 띄어서는 안 됩니다.
          </p>

          <h3 className="text-xl md:text-2xl font-bold mt-10 mb-4 text-foreground/90">
            3. 콘텐츠 기반 페이지가 아닌 페이지에 광고를 게재하지 마세요.
          </h3>
          <p className="text-foreground/80 leading-relaxed mb-8">
            전반적으로 가치 있는 콘텐츠를 제공하는 웹사이트에 수익을 창출하는 데는 적합하지 않은 섹션이나 페이지가 있는 경우도 종종 있습니다. 방문이나 구매에 대한 감사 메시지가 표시되는 페이지처럼 사용자가 도메인에서 나갈 수도 있는 상황에 앞서 방문하는 페이지가 여기에 해당합니다. 또 다른 예로 해당 URL에 콘텐츠가 없음을 사용자에게 알려 주는 404 오류 페이지를 들 수 있습니다.
          </p>
        </section>

        <hr className="my-10 border-border" />

        {/* Conclusion */}
        <section id="conclusion" className="bg-primary/5 rounded-3xl p-8 border border-primary/10">
          <h2 className="text-xl md:text-2xl font-bold mt-0 mb-4 text-primary">결론</h2>
          <p className="text-foreground/80 leading-relaxed mb-6 font-medium">
            성공으로 가는 지름길은 없으며 고품질 사이트를 구축하려면 많은 시간과 노력을 투자해야 합니다. 그간 애드센스 네트워크를 운영해 본 경험에 의하면 사용자를 현혹하는 손쉬운 기법을 사용하기 보다는 품질이 우수한 콘텐츠를 제공하는 데 주력한 게시자가 장기적으로 더 큰 수익과 성공을 거두었습니다.
          </p>
          <div className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-primary/20 text-center my-8">
            <p className="text-xl md:text-2xl font-black text-foreground/90 tracking-tight leading-relaxed italic">
              "사용자에게 초점을 맞추면 나머지는 저절로 따라옵니다."
            </p>
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-3 text-foreground/80">참고 자료 및 출처</h3>
            <ul className="text-sm space-y-2 text-foreground/60 break-all">
              <li>
                <a href="https://adsense-ko.googleblog.com/2012/04/blog-post_25.html" target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline flex items-center gap-2">
                  <span>🔗</span> 고품질 사이트를 만들기 위한 도움말 1부 (Lingjuan Zhang)
                </a>
              </li>
              <li>
                <a href="https://adsense-ko.googleblog.com/2012/09/2.html" target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline flex items-center gap-2">
                  <span>🔗</span> 고품질 사이트를 만들기 위한 도움말 2부 (Francesco Angeli)
                </a>
              </li>
              <li>
                <a href="https://adsense.google.com/intl/ko_kr/start/resources/best-format-your-site-for-adsense/" target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline flex items-center gap-2">
                  <span>🔗</span> 애드센스 사이트 형식 권장사항
                </a>
              </li>
            </ul>
          </div>
        </section>

        {/* 하단 광고 */}
        <div className="mt-12 rounded-2xl overflow-hidden bg-background/50 border border-border p-2">
          <AdBanner dataAdSlot="bottom-banner-slot" />
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center justify-center rounded-xl bg-surface border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-background hover:text-primary transition-colors shadow-sm">
            메인 페이지로 돌아가기
          </Link>
        </div>
      </article>
    </main>
  );
}
