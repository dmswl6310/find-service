import { sendGAEvent } from "@next/third-parties/google";

// GA4 맞춤 이벤트. 이름과 값은 GA4 보고서에서 그대로 보이므로 바꿀 때 주의
export type AnalyticsEvent =
  | { name: "ai_suggest_request"; params: { result: "success" | "error"; status_code: number } }
  | { name: "ai_suggest_add"; params: { added_count: number } }
  | { name: "compare_run"; params: { end_count: number; ai_end_count: number } };

// GA 스크립트가 없는 곳(로컬 테스트, 광고 차단 등)에서는 조용히 아무것도 하지 않는다.
// 분석 실패가 기능을 막으면 안 되므로 에러도 삼킨다.
export function trackEvent({ name, params }: AnalyticsEvent): void {
  if (typeof window === "undefined" || !("dataLayer" in window)) return;
  try {
    sendGAEvent("event", name, params);
  } catch {
    // 무시
  }
}
