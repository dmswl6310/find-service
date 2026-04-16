"use client";

import { useState, useEffect } from "react";
import { KakaoLocation, KakaoSearchResponse } from "@/types/kakao";

export function useLocationSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KakaoLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 300ms 디바운스 적용
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data: KakaoSearchResponse = await res.json();
          setResults(data.documents);
          setIsOpen(true);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error("Failed to fetch locations:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return { query, setQuery, results, isLoading, isOpen, setIsOpen };
}
