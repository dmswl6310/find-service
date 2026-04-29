"use client";

import { useEffect, useRef, useState } from "react";
import type { KakaoLocation, KakaoSearchResponse } from "@/types/kakao";

const LOCATION_SEARCH_DEBOUNCE_MS = 300;

export function useLocationSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<KakaoLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, LOCATION_SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim();

    if (!trimmedQuery) {
      requestSeqRef.current += 1;
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    const requestSeq = ++requestSeqRef.current;
    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (requestSeq !== requestSeqRef.current) {
          return;
        }

        if (res.ok) {
          const data: KakaoSearchResponse = await res.json();
          setResults(data.documents);
          setIsOpen(true);
          setError(null);
          return;
        }

        setResults([]);
        setIsOpen(false);
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error || "장소 검색 중 오류가 발생했습니다.");
      } catch (error) {
        console.error("Failed to fetch locations:", error);
        if (requestSeq === requestSeqRef.current) {
          setResults([]);
          setIsOpen(false);
          setError("장소 검색 중 오류가 발생했습니다.");
        }
      } finally {
        if (requestSeq === requestSeqRef.current) {
          setIsLoading(false);
        }
      }
    };

    void fetchLocations();
  }, [debouncedQuery]);

  return { query, setQuery, results, isLoading, isOpen, setIsOpen, error };
}
