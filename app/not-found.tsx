import Link from "next/link";

const helpfulLinks = [
  { href: "/", label: "경로 비교 시작하기" },
  { href: "/middle-point", label: "중간지점 찾기" },
  { href: "/multi-route", label: "다대다 비교 방법" },
  { href: "/contact", label: "문의하기" },
];

export default function NotFound() {
  return (
    <main className="flex-1 w-full max-w-[820px] mx-auto p-6 md:p-10 mb-20 mt-4 md:mt-8 bg-surface rounded-3xl shadow-sm border border-border">
      <section className="text-center">
        <p className="mb-3 text-sm font-semibold text-action">404</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 text-text">
          찾을 수 없는 페이지입니다
        </h1>
        <p className="text-text/65 leading-8">
          주소가 바뀌었거나 삭제된 페이지일 수 있습니다. 아래 링크에서 모두스팟의
          주요 기능과 안내 페이지로 이동할 수 있습니다.
        </p>
      </section>

      <nav aria-label="도움이 되는 링크" className="mt-10 grid gap-3 sm:grid-cols-2">
        {helpfulLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl border border-border bg-canvas px-5 py-4 text-sm font-semibold text-text hover:text-action transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
