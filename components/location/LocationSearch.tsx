"use client";

import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import type { KakaoLocation } from "@/types/kakao";

export interface LocationSearchProps {
  label: string;
  placeholder?: string;
  helperText?: string;
  selectedName?: string;
  onSelect: (location: KakaoLocation) => void;
}

export default function LocationSearch({
  label,
  placeholder = "장소 검색",
  helperText,
  selectedName,
  onSelect,
}: LocationSearchProps) {
  const { query, setQuery, results, isLoading, isOpen, setIsOpen, error, hasSearched } = useLocationSearch();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeOption, setActiveOption] = useState<{ id: string; query: string; results: KakaoLocation[] } | null>(null);
  const listboxId = useId();
  const inputId = useId();
  const activeIndex = activeOption?.query === query && activeOption.results === results
    ? results.findIndex((location) => location.id === activeOption.id)
    : -1;
  const shouldShowNoResults = isOpen && hasSearched && !isLoading && query.trim().length > 0 && results.length === 0 && !error;
  const shouldShowDropdown = isOpen && (results.length > 0 || shouldShowNoResults);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveOption(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  useEffect(() => {
    if (selectedName) {
      setQuery(selectedName);
    }
  }, [selectedName, setQuery]);

  const handleSelect = (location: KakaoLocation) => {
    setQuery("");
    setIsOpen(false);
    setActiveOption(null);
    onSelect(location);
  };

  const handleFocus = () => {
    if (query.trim() && (results.length > 0 || hasSearched)) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveOption(null);
      return;
    }

    if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp") && results.length > 0) {
      setIsOpen(true);
    }

    if (event.key === "ArrowDown" && results.length > 0) {
      event.preventDefault();
      const nextIndex = (activeIndex + 1) % results.length;
      setActiveOption({ id: results[nextIndex].id, query, results });
      return;
    }

    if (event.key === "ArrowUp" && results.length > 0) {
      event.preventDefault();
      const previousIndex = activeIndex <= 0 ? results.length - 1 : activeIndex - 1;
      setActiveOption({ id: results[previousIndex].id, query, results });
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
      event.preventDefault();
      handleSelect(results[activeIndex]);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <label htmlFor={inputId} className="sr-only">{label}</label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={shouldShowDropdown}
          aria-controls={shouldShowDropdown ? listboxId : undefined}
          aria-activedescendant={activeIndex >= 0 && results[activeIndex] ? `${listboxId}-${results[activeIndex].id}` : undefined}
          className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2" role="status" aria-label="장소 검색 중">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-origin border-t-transparent" />
          </div>
        )}
      </div>

      {helperText && <p className="mt-2 text-xs text-text-muted">{helperText}</p>}
      {error && <p className="mt-2 text-xs font-medium text-danger" role="alert">{error}</p>}

      {shouldShowDropdown && (
        <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface-raised shadow-lg">
          <ul id={listboxId} role="listbox" className="max-h-60 w-full overflow-y-auto">
            {results.map((location) => {
              const isActive = results[activeIndex]?.id === location.id;
              return (
                <li
                  key={location.id}
                  id={`${listboxId}-${location.id}`}
                  role="option"
                  aria-selected={isActive}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(location)}
                  className={`w-full cursor-pointer border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-canvas ${isActive ? "bg-origin-soft" : ""}`}
                >
                  <p className="font-medium text-text">{location.place_name}</p>
                  <p className="mt-0.5 text-xs text-text-muted">{location.road_address_name || location.address_name}</p>
                </li>
              );
            })}
            {shouldShowNoResults && (
              <li className="px-4 py-3 text-sm text-text-muted" aria-live="polite">
                검색 결과가 없습니다. 다른 키워드로 시도해 보세요.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
