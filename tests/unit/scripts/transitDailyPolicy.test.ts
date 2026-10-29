// @vitest-environment node
import {describe, expect, it} from "vitest";
import {dailyAllowance, quotaDay} from "../../../scripts/transit-daily-policy.mjs";
describe("daily quota policy", () => {
  const now = new Date("2026-10-06T23:01:00Z");
  const evidence = {used: 0, limit: 30, confirmedAt: "2026-10-06T23:00:00Z", source: "user-current-console"};
  it("uses the Korean calendar day", () => expect(quotaDay(now)).toBe("2026-10-07"));
  it("permits the full remaining quota without a service reserve", () => {
    expect(dailyAllowance(evidence, now, 0)).toBe(30);
    expect(dailyAllowance({...evidence, used: 5}, now, 0)).toBe(25);
    expect(dailyAllowance(evidence, now, 9)).toBe(21);
    expect(dailyAllowance({...evidence, used: 30}, now, 0)).toBe(0);
  });
  it("rejects stale, missing or invalid usage evidence before network access", () => {
    expect(() => dailyAllowance({...evidence, confirmedAt: "2026-10-05T23:00:00Z"}, now, 0)).toThrow();
    expect(() => dailyAllowance({...evidence, confirmedAt: "2026-10-06T21:00:00Z"}, now, 0)).toThrow();
    expect(() => dailyAllowance({...evidence, source: ""}, now, 0)).toThrow();
    expect(() => dailyAllowance({...evidence, used: -1}, now, 0)).toThrow();
    expect(() => dailyAllowance({...evidence, used: 31}, now, 0)).toThrow();
  });
});
