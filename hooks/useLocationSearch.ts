"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KakaoLocation, KakaoSearchResponse } from "@/types/kakao";

const LOCATION_SEARCH_DEBOUNCE_MS = 300;

export function useLocationSearch() {
  const [query, setQueryState] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<KakaoLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const requestSeqRef = useRef(0);

  const setQuery = useCallback((nextQuery: string) => {
    requestSeqRef.current += 1;
    setQueryState(nextQuery);
    setResults([]);
    setIsOpen(false);
    setIsLoading(false);
    setError(null);
    setHasSearched(false);
  }, []);

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
      setHasSearched(false);
      return;
    }

    const requestSeq = ++requestSeqRef.current;
    const abortController = new AbortController();
    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`, {
          signal: abortController.signal,
        });
        if (requestSeq !== requestSeqRef.current) {
          return;
        }

        if (res.ok) {
          const data: KakaoSearchResponse = await res.json();
          if (requestSeq !== requestSeqRef.current) {
            return;
          }
          setResults(data.documents);
          setIsOpen(true);
          setError(null);
          setHasSearched(true);
          return;
        }

        setResults([]);
        setIsOpen(false);
        setHasSearched(true);
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        if (requestSeq !== requestSeqRef.current) {
          return;
        }
        setError(data?.error || "장소 검색 중 오류가 발생했습니다.");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Failed to fetch locations:", error);
        if (requestSeq === requestSeqRef.current) {
          setResults([]);
          setIsOpen(false);
          setHasSearched(true);
          setError("장소 검색 중 오류가 발생했습니다.");
        }
      } finally {
        if (requestSeq === requestSeqRef.current) {
          setIsLoading(false);
        }
      }
    };

    void fetchLocations();

    return () => abortController.abort();
  }, [debouncedQuery]);

  return { query, setQuery, results, isLoading, isOpen, setIsOpen, error, hasSearched };
}
