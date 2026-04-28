import { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import type { KakaoLocation } from "@/types/kakao";
import { decodeSharedLocations, toKakaoLocations } from "@/utils/shareUrl";

type RouteSyncProps = {
  calculateMatrix: (starts: KakaoLocation[], ends: KakaoLocation[], targetDate?: string, targetTime?: string) => Promise<void>;
};

export default function RouteSync({ calculateMatrix }: RouteSyncProps) {
  const searchParams = useSearchParams();
  const processedShareKeyRef = useRef<string | null>(null);
  const { setStarts, setEnds, useDepartureTime, targetDate, targetTime } = useAppStore();

  const handleCalculate = useCallback(
    (starts: KakaoLocation[], ends: KakaoLocation[]) => {
      if (starts.length > 0 && ends.length > 0) {
        calculateMatrix(starts, ends, useDepartureTime ? targetDate : undefined, useDepartureTime ? targetTime : undefined);
      }
    },
    [calculateMatrix, targetDate, targetTime, useDepartureTime]
  );

  useEffect(() => {
    const sParam = searchParams.get("s");
    const eParam = searchParams.get("e");
    const shareKey = sParam && eParam ? `${sParam}:${eParam}` : null;

    if (sParam && eParam && shareKey !== processedShareKeyRef.current) {
      try {
        const mappedStarts = toKakaoLocations(decodeSharedLocations(sParam));
        const mappedEnds = toKakaoLocations(decodeSharedLocations(eParam));
        processedShareKeyRef.current = shareKey;

        setStarts(mappedStarts);
        setEnds(mappedEnds);
        handleCalculate(mappedStarts, mappedEnds);
      } catch (err) {
        console.error("Failed to parse shared URL:", err);
      }
    }
  }, [handleCalculate, searchParams, setEnds, setStarts]);

  return null;
}
