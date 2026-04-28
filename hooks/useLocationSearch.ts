"use client";

import { useState, useEffect, useRef } from "react";
import { KakaoLocation, KakaoSearchResponse } from "@/types/kakao";

const LOCATION_SEARCH_DEBOUNCE_MS = 300;

export function useLocationSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<KakaoLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
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
          return;
        }

        setResults([]);
      } catch (error) {
        console.error("Failed to fetch locations:", error);
        if (requestSeq === requestSeqRef.current) {
          setResults([]);
        }
      } finally {
        if (requestSeq === requestSeqRef.current) {
          setIsLoading(false);
        }
      }
    };

    void fetchLocations();
  }, [debouncedQuery]);

  return { query, setQuery, results, isLoading, isOpen, setIsOpen };
}
