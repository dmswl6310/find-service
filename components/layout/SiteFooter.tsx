import Link from "next/link";

const serviceLinks = [
  { href: "/tips", label: "이용 방법" },
  { href: "/middle-point", label: "중간지점 찾기" },
  { href: "/multi-route", label: "다대다 비교" },
  { href: "/story", label: "모두스팟 이야기" },
  { href: "/about", label: "서비스 소개" },
];

export default function SiteFooter() {
  return (
    <footer aria-label="사이트 정보" className="mt-auto w-full border-t border-border bg-surface-raised">
      <div className="mx-auto grid w-full max-w-[1400px] gap-6 px-4 py-8 text-sm sm:px-6 md:grid-cols-[1fr_auto] md:items-start md:px-8">
        <p className="text-text-muted">© {new Date().getFullYear()} 모두스팟. Made by Eunji.</p>
        <div className="grid gap-5 md:justify-items-end">
          <nav aria-label="서비스 안내">
            <p className="mb-2 text-sm font-semibold text-text">서비스 안내</p>
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-text-muted">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-action">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="정책 및 문의">
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-text-muted">
              <li><Link href="/privacy" className="transition-colors hover:text-action">개인정보처리방침</Link></li>
              <li><Link href="/terms" className="transition-colors hover:text-action">이용약관</Link></li>
              <li><Link href="/contact" className="transition-colors hover:text-action">문의</Link></li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
