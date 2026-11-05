import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AiSuggestPanel from "@/components/suggest/AiSuggestPanel";
import {
  SUGGEST_FALLBACK_MESSAGE,
  toCandidateLocation,
  useSuggestCandidates,
} from "@/hooks/useSuggestCandidates";
import { makeLocation } from "@/tests/fixtures/transit";

const starts = [makeLocation("s1", "강남역"), makeLocation("s2", "홍대입구역")];
const yongsan = { ...makeLocation("21160921", "용산역 경의중앙선"), distance: "989" };

function panelProps(overrides: Partial<Parameters<typeof AiSuggestPanel>[0]> = {}) {
  return {
    startCount: 2,
    ends: [],
    status: "idle" as const,
    candidates: [],
    error: null,
    onSuggest: vi.fn(),
    onAddEnd: vi.fn(),
    ...overrides,
  };
}

describe("toCandidateLocation", () => {
  it("keeps only app fields and drops the line name", () => {
    expect(toCandidateLocation(yongsan)).toEqual({
      id: "21160921",
      place_name: "용산역",
      address_name: "서울",
      road_address_name: "서울",
      x: "127.0",
      y: "37.5",
    });
  });
});

describe("AiSuggestPanel", () => {
  it("is hidden until there are at least two starts", () => {
    const { container } = render(<AiSuggestPanel {...panelProps({ startCount: 1 })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("fills the purpose from an example and submits the trimmed text", () => {
    const props = panelProps();
    render(<AiSuggestPanel {...props} />);

    const submit = screen.getByRole("button", { name: "AI로 후보 3곳 찾기" });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "카페에서 오래 수다" }));
    fireEvent.click(submit);

    expect(props.onSuggest).toHaveBeenCalledWith("카페에서 오래 수다");
  });

  it("shows results and adds a candidate once", () => {
    const station = toCandidateLocation(yongsan);
    const props = panelProps({ status: "success", candidates: [{ station, reason: "활기찬 분위기" }] });
    const { rerender } = render(<AiSuggestPanel {...props} />);

    expect(screen.getByText("활기찬 분위기")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "용산역 후보에 추가" }));
    expect(props.onAddEnd).toHaveBeenCalledWith(station);

    rerender(<AiSuggestPanel {...props} ends={[station]} />);
    expect(screen.getByRole("button", { name: "용산역 추가됨" })).toBeDisabled();
  });

  it("shows the fallback notice on error", () => {
    render(<AiSuggestPanel {...panelProps({ status: "error", error: SUGGEST_FALLBACK_MESSAGE })} />);
    expect(screen.getByRole("status")).toHaveTextContent(SUGGEST_FALLBACK_MESSAGE);
  });
});

describe("useSuggestCandidates", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts starts and purpose, then stores cleaned candidates", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ candidates: [{ reason: "활기찬 분위기", station: yongsan }] }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useSuggestCandidates());

    await act(() => result.current.suggest(starts, "사람 많은 곳"));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/suggest");
    expect(JSON.parse(init.body)).toEqual({
      starts: [
        { name: "강남역", x: "127.0", y: "37.5" },
        { name: "홍대입구역", x: "127.0", y: "37.5" },
      ],
      purpose: "사람 많은 곳",
    });
    expect(result.current.status).toBe("success");
    expect(result.current.candidates[0].station.place_name).toBe("용산역");
  });

  it("falls back to manual entry when the API fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "x" }), { status: 503 })));
    const { result } = renderHook(() => useSuggestCandidates());

    await act(() => result.current.suggest(starts, "회식"));

    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe(SUGGEST_FALLBACK_MESSAGE);
  });
});
