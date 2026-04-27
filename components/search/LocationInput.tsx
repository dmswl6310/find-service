"use client";

import { useLocationSearch } from "@/hooks/useLocationSearch";
import { KakaoLocation } from "@/types/kakao";
import { useRef, useEffect } from "react";

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
  const { query, setQuery, results, isLoading, isOpen, setIsOpen } = useLocationSearch();
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    onSelect(loc);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim() && results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground focus-ring shadow-sm transition-all"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {helperText && <p className="mt-2 text-xs text-foreground/55">{helperText}</p>}

      {/* 자동완성 드롭다운 */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-surface border border-border rounded-xl shadow-lg overflow-hidden glass mix-blend-normal">
          <ul className="max-h-60 overflow-y-auto w-full">
            {results.map((loc) => (
              <li
                key={loc.id}
                onClick={() => handleSelect(loc)}
                className="px-4 py-3 hover:bg-primary/10 cursor-pointer transition-colors border-b border-border/50 last:border-0"
              >
                <p className="font-medium text-foreground">{loc.place_name}</p>
                <p className="text-xs text-foreground/60 mt-0.5">{loc.road_address_name || loc.address_name}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
