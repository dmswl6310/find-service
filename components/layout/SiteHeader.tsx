"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const mobileLinks = [
  { href: "/", label: "장소 비교" },
  { href: "/tips", label: "이용 방법" },
  { href: "/middle-point", label: "중간지점 찾기" },
  { href: "/multi-route", label: "다대다 비교" },
  { href: "/story", label: "모두스팟 이야기" },
  { href: "/about", label: "서비스 소개" },
  { href: "/contact", label: "문의" },
];

const desktopLinks = mobileLinks.filter((link) =>
  ["장소 비교", "이용 방법", "서비스 소개"].includes(link.label)
);

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuState, setMenuState] = useState({ isOpen: false, pathname });
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  if (menuState.pathname !== pathname) {
    setMenuState({ isOpen: false, pathname });
  }
  const isMenuOpen = menuState.isOpen;

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !isMenuOpen) return;
      setMenuState({ isOpen: false, pathname });
      menuButtonRef.current?.focus();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMenuOpen, pathname]);

  return (
    <header className="relative z-20 h-16 border-b border-border bg-surface">
      <div className="mx-auto flex h-full w-full max-w-[1400px] items-center gap-3 px-4 sm:px-6 md:px-8">
        <Link href="/" className="inline-flex min-h-11 shrink-0 items-center text-lg font-semibold tracking-tight text-text">
          모두스팟
        </Link>
        <nav aria-label="주요 내비게이션" className="ml-auto hidden items-center gap-6 text-sm font-medium text-text-muted md:flex">
          {desktopLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-action">
              {link.label}
            </Link>
          ))}
        </nav>
        <Link href="/" className="ml-auto inline-flex min-h-11 items-center text-sm font-medium text-action md:hidden">
          장소 비교
        </Link>
        <button
          ref={menuButtonRef}
          type="button"
          aria-controls="site-mobile-menu"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border text-sm font-medium text-text transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action md:hidden"
          onClick={() => setMenuState({ isOpen: !isMenuOpen, pathname })}
        >
          <span aria-hidden="true" className="grid gap-1">
            <span className="block h-px w-4 bg-current" />
            <span className="block h-px w-4 bg-current" />
            <span className="block h-px w-4 bg-current" />
          </span>
        </button>
      </div>
      {isMenuOpen && (
        <nav
          id="site-mobile-menu"
          aria-label="모바일 메뉴"
          className="absolute inset-x-0 top-16 border-b border-border bg-surface p-4 shadow-sm md:hidden"
        >
          <ul className="mx-auto grid w-full max-w-[1400px] gap-1">
            {mobileLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-lg px-3 py-3 text-sm font-medium text-text transition-colors hover:bg-surface-raised hover:text-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                  onClick={() => setMenuState({ isOpen: false, pathname })}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
