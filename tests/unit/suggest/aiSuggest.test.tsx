import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AiSuggestPanel from "@/components/suggest/AiSuggestPanel";
import AiSuggestSection from "@/components/suggest/AiSuggestSection";
import {
  SUGGEST_FALLBACK_MESSAGE,
  SUGGEST_NO_STATIONS_MESSAGE,
  SUGGEST_RATE_LIMIT_MESSAGE,
  SUGGEST_TIMEOUT_MESSAGE,
  getSuggestErrorMessage,
  toCandidateLocation,
  useSuggestCandidates,
} from "@/hooks/useSuggestCandidates";
import { trackEvent } from "@/lib/analytics";
import { makeLocation } from "@/tests/fixtures/transit";

vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

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

describe("AiSuggestSection", () => {
  it("shows only a button until opened, then opens and closes the dialog", () => {
    render(<AiSuggestSection starts={starts} ends={[]} onAddEnd={() => undefined} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "✨ AI로 찾기" }));
    expect(screen.getByRole("dialog", { name: "AI로 목적지 후보 찾기" })).toBeVisible();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("adds nothing when closed with the X after selecting", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ candidates: [{ reason: "활기찬 분위기", station: yongsan }] }), { status: 200 })
      )
    );
    const onAddEnd = vi.fn();
    render(<AiSuggestSection starts={starts} ends={[]} onAddEnd={onAddEnd} />);

    fireEvent.click(screen.getByRole("button", { name: "✨ AI로 찾기" }));
    fireEvent.change(screen.getByLabelText("모임 목적"), { target: { value: "회식" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "AI로 후보 3곳 찾기" }));
    });
    fireEvent.click(await screen.findByRole("button", { name: "용산역 선택" }));
    fireEvent.click(screen.getByRole("button", { name: "AI 후보 찾기 닫기" }));

    expect(onAddEnd).not.toHaveBeenCalled();
    // 다시 열면 선택이 지워져 있다
    fireEvent.click(screen.getByRole("button", { name: "✨ AI로 찾기" }));
    expect(screen.getByRole("button", { name: "용산역 선택" })).toHaveAttribute("aria-pressed", "false");
  });
});

describe("AiSuggestPanel", () => {
  it("asks for two starts instead of the form", () => {
    render(<AiSuggestPanel {...panelProps({ startCount: 1 })} />);
    expect(screen.getByText("출발지를 2곳 이상 넣어 주세요")).toBeVisible();
    expect(screen.queryByRole("button", { name: "AI로 후보 3곳 찾기" })).not.toBeInTheDocument();
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

  it("selects candidates first and adds them only with the bottom button", () => {
    const first = toCandidateLocation(yongsan);
    const second = toCandidateLocation({ ...yongsan, id: "st2", place_name: "삼각지역" });
    const onDone = vi.fn();
    const props = panelProps({
      status: "success",
      candidates: [
        { station: first, reason: "활기찬 분위기" },
        { station: second, reason: "조용한 골목" },
      ],
      onDone,
    });
    render(<AiSuggestPanel {...props} />);

    expect(screen.getByText("활기찬 분위기")).toBeVisible();
    expect(screen.getByRole("button", { name: "추가할 곳을 선택해 주세요" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "용산역 선택" }));
    fireEvent.click(screen.getByRole("button", { name: "삼각지역 선택" }));
    expect(screen.getByRole("button", { name: "용산역 선택" })).toHaveAttribute("aria-pressed", "true");
    // 고르기만 해서는 추가되지 않는다
    expect(props.onAddEnd).not.toHaveBeenCalled();

    // 다시 누르면 선택 해제
    fireEvent.click(screen.getByRole("button", { name: "삼각지역 선택" }));
    fireEvent.click(screen.getByRole("button", { name: "선택한 1곳 추가" }));

    expect(props.onAddEnd).toHaveBeenCalledTimes(1);
    expect(props.onAddEnd).toHaveBeenCalledWith(first);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith({ name: "ai_suggest_add", params: { added_count: 1 } });
  });

  it("shows stations already in the list as added and not selectable", () => {
    const station = toCandidateLocation(yongsan);
    render(<AiSuggestPanel {...panelProps({ status: "success", ends: [station], candidates: [{ station, reason: "활기찬 분위기" }] })} />);
    expect(screen.getByRole("button", { name: "용산역 이미 추가됨" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "추가할 곳을 선택해 주세요" })).toBeDisabled();
  });

  it("hides the add button before results", () => {
    render(<AiSuggestPanel {...panelProps({ onDone: vi.fn() })} />);
    expect(screen.queryByRole("button", { name: /선택해 주세요|곳 추가/ })).not.toBeInTheDocument();
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

  it("posts starts, purpose and existing ends, then stores cleaned candidates", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ candidates: [{ reason: "활기찬 분위기", station: yongsan }] }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useSuggestCandidates());

    await act(() => result.current.suggest(starts, "사람 많은 곳", [makeLocation("e1", "성수")]));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/suggest");
    expect(JSON.parse(init.body)).toEqual({
      starts: [
        { name: "강남역", x: "127.0", y: "37.5" },
        { name: "홍대입구역", x: "127.0", y: "37.5" },
      ],
      purpose: "사람 많은 곳",
      ends: [{ x: "127.0", y: "37.5" }],
    });
    expect(result.current.status).toBe("success");
    expect(result.current.candidates[0].station.place_name).toBe("용산역");
    expect(trackEvent).toHaveBeenCalledWith({ name: "ai_suggest_request", params: { result: "success", status_code: 200 } });
  });

  it("falls back to manual entry when the API fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "x" }), { status: 500 })));
    const { result } = renderHook(() => useSuggestCandidates());

    await act(() => result.current.suggest(starts, "회식"));

    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe(SUGGEST_FALLBACK_MESSAGE);
  });

  it("tells the user to wait when rate limited", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "x" }), { status: 429 })));
    const { result } = renderHook(() => useSuggestCandidates());

    await act(() => result.current.suggest(starts, "회식"));

    expect(result.current.error).toBe(SUGGEST_RATE_LIMIT_MESSAGE);
    expect(trackEvent).toHaveBeenCalledWith({ name: "ai_suggest_request", params: { result: "error", status_code: 429 } });
  });

  it("maps each server status to a message", () => {
    expect(getSuggestErrorMessage(429)).toBe(SUGGEST_RATE_LIMIT_MESSAGE);
    expect(getSuggestErrorMessage(503)).toBe(SUGGEST_NO_STATIONS_MESSAGE);
    expect(getSuggestErrorMessage(504)).toBe(SUGGEST_TIMEOUT_MESSAGE);
    expect(getSuggestErrorMessage(502)).toBe(SUGGEST_FALLBACK_MESSAGE);
    expect(getSuggestErrorMessage(400)).toBe(SUGGEST_FALLBACK_MESSAGE);
  });
});
