import { afterEach, describe, expect, it, vi } from "vitest";

const sendGAEvent = vi.hoisted(() => vi.fn());
vi.mock("@next/third-parties/google", () => ({ sendGAEvent }));

import { trackEvent } from "@/lib/analytics";

describe("trackEvent", () => {
  afterEach(() => {
    sendGAEvent.mockReset();
    delete (window as { dataLayer?: unknown }).dataLayer;
  });

  it("GA가 없으면 아무것도 보내지 않는다", () => {
    trackEvent({ name: "ai_suggest_add", params: { added_count: 2 } });
    expect(sendGAEvent).not.toHaveBeenCalled();
  });

  it("GA가 있으면 이벤트 이름과 값을 보낸다", () => {
    (window as { dataLayer?: unknown[] }).dataLayer = [];
    trackEvent({ name: "compare_run", params: { end_count: 3, ai_end_count: 1 } });
    expect(sendGAEvent).toHaveBeenCalledWith("event", "compare_run", { end_count: 3, ai_end_count: 1 });
  });

  it("GA 쪽에서 에러가 나도 기능을 막지 않는다", () => {
    (window as { dataLayer?: unknown[] }).dataLayer = [];
    sendGAEvent.mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => trackEvent({ name: "ai_suggest_add", params: { added_count: 1 } })).not.toThrow();
  });
});
