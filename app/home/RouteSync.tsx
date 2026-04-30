import { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import type { KakaoLocation } from "@/types/kakao";
import { decodeSharedLocations, readSharedDepartureTimeParams, toKakaoLocations } from "@/utils/shareUrl";

type RouteSyncProps = {
  calculateMatrix: (starts: KakaoLocation[], ends: KakaoLocation[], targetDate?: string, targetTime?: string) => Promise<void>;
};

export default function RouteSync({ calculateMatrix }: RouteSyncProps) {
  const searchParams = useSearchParams();
  const processedShareKeyRef = useRef<string | null>(null);
  const {
    setStarts,
    setEnds,
    setUseDepartureTime,
    setTargetDate,
    setTargetTime,
    useDepartureTime,
    targetDate,
    targetTime,
  } = useAppStore();

  const handleCalculate = useCallback(
    (starts: KakaoLocation[], ends: KakaoLocation[], restoredTime?: { enabled: boolean; date?: string; time?: string } | null) => {
      if (starts.length > 0 && ends.length > 0) {
        const enabled = restoredTime?.enabled ?? useDepartureTime;
        const date = restoredTime?.date ?? targetDate;
        const time = restoredTime?.time ?? targetTime;

        calculateMatrix(starts, ends, enabled ? date : undefined, enabled ? time : undefined);
      }
    },
    [calculateMatrix, targetDate, targetTime, useDepartureTime]
  );

  useEffect(() => {
    const sParam = searchParams.get("s");
    const eParam = searchParams.get("e");
    const timeParams = readSharedDepartureTimeParams(searchParams);
    const shareKey = sParam && eParam ? `${sParam}:${eParam}:${searchParams.get("dt") || ""}:${searchParams.get("d") || ""}:${searchParams.get("t") || ""}` : null;

    if (sParam && eParam && shareKey !== processedShareKeyRef.current) {
      try {
        const mappedStarts = toKakaoLocations(decodeSharedLocations(sParam));
        const mappedEnds = toKakaoLocations(decodeSharedLocations(eParam));
        processedShareKeyRef.current = shareKey;

        if (timeParams) {
          setUseDepartureTime(timeParams.enabled);
          if (timeParams.date) setTargetDate(timeParams.date);
          if (timeParams.time) setTargetTime(timeParams.time);
        }

        setStarts(mappedStarts);
        setEnds(mappedEnds);
        handleCalculate(mappedStarts, mappedEnds, timeParams);
      } catch (err) {
        console.error("Failed to parse shared URL:", err);
      }
    }
  }, [handleCalculate, searchParams, setEnds, setStarts, setTargetDate, setTargetTime, setUseDepartureTime]);

  return null;
}
