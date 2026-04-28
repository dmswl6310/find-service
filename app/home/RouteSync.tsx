import { useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { KakaoLocation } from "@/types/kakao";
import { decodeSharedLocations, toKakaoLocations } from "@/utils/shareUrl";

type RouteSyncProps = {
  calculateMatrix: (starts: KakaoLocation[], ends: KakaoLocation[], targetDate?: string, targetTime?: string) => Promise<void>;
};

export default function RouteSync({ calculateMatrix }: RouteSyncProps) {
  const searchParams = useSearchParams();
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

    if (sParam && eParam) {
      try {
        const mappedStarts = toKakaoLocations(decodeSharedLocations(sParam));
        const mappedEnds = toKakaoLocations(decodeSharedLocations(eParam));

        setStarts(mappedStarts);
        setEnds(mappedEnds);
        handleCalculate(mappedStarts, mappedEnds);
      } catch (err) {
        console.error("Failed to parse shared URL:", err);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
