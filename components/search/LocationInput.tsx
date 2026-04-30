"use client";

import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import type { KakaoLocation } from "@/types/kakao";

interface LocationInputProps {
  placeholder?: string;
  onSelect: (location: KakaoLocation) => void;
  selectedName?: string;
  helperText?: string;
}

export default function LocationInput({
  placeholder = "장소 검색",
  onSelect,
  selectedName,
  helperText,
}: LocationInputProps) {
  const { query, setQuery, results, isLoading, isOpen, setIsOpen, error, hasSearched } = useLocationSearch();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = useId();
  const shouldShowNoResults = isOpen && hasSearched && !isLoading && query.trim().length > 0 && results.length === 0 && !error;
  const shouldShowDropdown = isOpen && (results.length > 0 || shouldShowNoResults);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  // 선택된 이름이 prop으로 들어오면 query 업데이트
  useEffect(() => {
    if (selectedName) {
      setQuery(selectedName);
    }
  }, [selectedName, setQuery]);

  const handleSelect = (loc: KakaoLocation) => {
    setQuery("");
    setIsOpen(false);
    setActiveIndex(-1);
    onSelect(loc);
  };

  const handleFocus = () => {
    if (query.trim() && (results.length > 0 || hasSearched)) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp") && results.length > 0) {
      setIsOpen(true);
    }

    if (event.key === "ArrowDown" && results.length > 0) {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % results.length);
      return;
    }

    if (event.key === "ArrowUp" && results.length > 0) {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? results.length - 1 : current - 1));
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
      event.preventDefault();
      handleSelect(results[activeIndex]);
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={shouldShowDropdown}
          aria-controls={shouldShowDropdown ? listboxId : undefined}
          aria-activedescendant={activeIndex >= 0 && results[activeIndex] ? `${listboxId}-${results[activeIndex].id}` : undefined}
          className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground focus-ring shadow-sm transition-all"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {helperText && <p className="mt-2 text-xs text-foreground/55">{helperText}</p>}
      {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}

      {/* 자동완성 드롭다운 */}
      {shouldShowDropdown && (
        <div className="absolute z-10 w-full mt-2 bg-surface border border-border rounded-xl shadow-lg overflow-hidden glass mix-blend-normal">
          <ul id={listboxId} role="listbox" className="max-h-60 overflow-y-auto w-full">
            {results.map((loc) => (
              <li key={loc.id} id={`${listboxId}-${loc.id}`} role="option" aria-selected={results[activeIndex]?.id === loc.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(loc)}
                  className={`w-full px-4 py-3 text-left hover:bg-primary/10 cursor-pointer transition-colors border-b border-border/50 last:border-0 ${results[activeIndex]?.id === loc.id ? "bg-primary/10" : ""}`}
                >
                  <p className="font-medium text-foreground">{loc.place_name}</p>
                  <p className="text-xs text-foreground/60 mt-0.5">{loc.road_address_name || loc.address_name}</p>
                </button>
              </li>
            ))}
            {shouldShowNoResults && (
              <li className="px-4 py-3 text-sm text-foreground/60" aria-live="polite">
                검색 결과가 없습니다. 다른 키워드로 시도해 보세요.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
