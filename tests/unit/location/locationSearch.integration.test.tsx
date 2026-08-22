import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LocationSearch from "@/components/location/LocationSearch";

function searchResponse(placeName: string) {
  return new Response(
    JSON.stringify({
      meta: { total_count: 1, pageable_count: 1, is_end: true },
      documents: [
        {
          id: placeName,
          place_name: placeName,
          address_name: "서울",
          road_address_name: "서울",
          x: "127",
          y: "37",
        },
      ],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

describe("LocationSearch 새 검색어 전환", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("새 query 응답 전에는 이전 결과를 ArrowDown·Enter로 선택하지 않는다", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(searchResponse("이전 장소"));
    const onSelect = vi.fn();
    render(<LocationSearch label="장소 검색" onSelect={onSelect} />);

    const input = screen.getByRole("combobox", { name: "장소 검색" });
    fireEvent.change(input, { target: { value: "이전" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
      await Promise.resolve();
    });
    expect(screen.getByRole("option", { name: /이전 장소/ })).toBeVisible();

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input).toHaveAttribute("aria-activedescendant", expect.stringContaining("이전 장소"));
    fireEvent.change(input, { target: { value: "새" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).not.toHaveAttribute("aria-activedescendant");
    expect(onSelect).not.toHaveBeenCalled();
  });
});
