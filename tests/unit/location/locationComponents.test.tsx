import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LocationGroup from "@/components/location/LocationGroup";
import LocationSearch from "@/components/location/LocationSearch";
import PlaceRow from "@/components/location/PlaceRow";
import LocationPanel from "@/app/home/LocationPanel";
import { makeLocation } from "@/tests/fixtures/transit";

const searchState = vi.hoisted(() => ({
  query: "",
  setQuery: vi.fn(),
  results: [] as ReturnType<typeof makeLocation>[],
  isLoading: false,
  isOpen: false,
  setIsOpen: vi.fn(),
  error: null as string | null,
  hasSearched: false,
}));

vi.mock("@/hooks/useLocationSearch", () => ({
  useLocationSearch: () => searchState,
}));

vi.mock("@/components/search/TimeFilter", () => ({ default: () => <div>시간 필터</div> }));
vi.mock("@/components/search/ShareButton", () => ({ default: () => <div>공유 버튼</div> }));

describe("장소 입력 컴포넌트", () => {
  beforeEach(() => {
    Object.assign(searchState, {
      query: "",
      results: [],
      isLoading: false,
      isOpen: false,
      error: null,
      hasSearched: false,
    });
    vi.clearAllMocks();
  });

  it("출발지에는 숫자 원형, 후보지에는 문자 둥근 사각형을 사용한다", () => {
    render(
      <>
        <PlaceRow location={makeLocation("s1", "홍대")} kind="origin" index={0} onSelect={() => undefined} onRemove={() => undefined} />
        <PlaceRow location={makeLocation("e1", "성수")} kind="candidate" index={0} onSelect={() => undefined} onRemove={() => undefined} />
      </>,
    );

    expect(screen.getByText("1")).toHaveClass("rounded-full", "bg-origin");
    expect(screen.getByText("A")).toHaveClass("rounded", "bg-candidate");
  });

  it("후보지 27번째 표식은 AA로 이어진다", () => {
    render(<PlaceRow location={makeLocation("e27", "스물일곱") } kind="candidate" index={26} onSelect={() => undefined} onRemove={() => undefined} />);

    expect(screen.getByText("AA")).toBeVisible();
  });

  it("장소 선택 행과 제거 버튼을 구분하고 선택 상태를 알린다", () => {
    const onSelect = vi.fn();
    const onRemove = vi.fn();
    render(<PlaceRow location={makeLocation("s1", "홍대")} kind="origin" index={0} selected onSelect={onSelect} onRemove={onRemove} />);

    fireEvent.click(screen.getByRole("button", { name: "홍대 선택" }));
    fireEvent.click(screen.getByRole("button", { name: "홍대 제거" }));

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onRemove).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "홍대 선택" })).toHaveAttribute("aria-pressed", "true");
  });

  it("이름이 있는 추가·제거 동작을 제공한다", () => {
    const onRemove = vi.fn();
    render(<LocationGroup kind="origin" title="출발지" locations={[makeLocation("s1", "홍대")]} onSelectLocation={() => undefined} onRemove={onRemove} onAdd={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "홍대 제거" }));
    expect(onRemove).toHaveBeenCalledWith("s1");
  });

  it("label을 접근 가능한 이름으로 반영하고 결과 option을 제공한다", () => {
    Object.assign(searchState, {
      query: "홍",
      results: [makeLocation("s1", "홍대")],
      isOpen: true,
      hasSearched: true,
    });
    render(<LocationSearch label="출발지 검색" placeholder="장소 입력" onSelect={() => undefined} />);

    const input = screen.getByRole("combobox", { name: "출발지 검색" });
    expect(input).toHaveAttribute("aria-controls");
    expect(screen.getByRole("option", { name: /홍대/ })).toBeVisible();
  });

  it("option은 포인터로 선택하지만 내부에 Tab으로 진입할 버튼을 두지 않는다", () => {
    const onSelect = vi.fn();
    Object.assign(searchState, {
      query: "홍",
      results: [makeLocation("s1", "홍대")],
      isOpen: true,
      hasSearched: true,
    });
    render(<LocationSearch label="장소 검색" onSelect={onSelect} />);

    const input = screen.getByRole("combobox", { name: "장소 검색" });
    const option = screen.getByRole("option", { name: /홍대/ });
    input.focus();
    fireEvent.mouseDown(option);
    fireEvent.click(option);

    expect(option.querySelector("button")).toBeNull();
    expect(document.activeElement).toBe(input);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "s1" }));
  });

  it("ArrowDown·ArrowUp·Enter·Escape로 콤보박스를 제어한다", () => {
    const onSelect = vi.fn();
    Object.assign(searchState, {
      query: "역",
      results: [makeLocation("s1", "강남역"), makeLocation("s2", "홍대입구역")],
      isOpen: true,
      hasSearched: true,
    });
    render(<LocationSearch label="장소 검색" onSelect={onSelect} />);

    const input = screen.getByRole("combobox", { name: "장소 검색" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input).toHaveAttribute("aria-activedescendant", expect.stringContaining("s1"));
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveAttribute("aria-activedescendant", expect.stringContaining("s2"));
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "s2" }));
    fireEvent.keyDown(input, { key: "Escape" });
    expect(searchState.setIsOpen).toHaveBeenLastCalledWith(false);
  });

  it("검색어 또는 결과가 바뀌면 이전 활성 항목을 선택하지 않는다", () => {
    const onSelect = vi.fn();
    Object.assign(searchState, {
      query: "강",
      results: [makeLocation("old", "강남역")],
      isOpen: true,
      hasSearched: true,
    });
    const { rerender } = render(<LocationSearch label="장소 검색" onSelect={onSelect} />);
    const input = screen.getByRole("combobox", { name: "장소 검색" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input).toHaveAttribute("aria-activedescendant", expect.stringContaining("old"));

    Object.assign(searchState, { query: "홍", results: [makeLocation("new", "홍대") ] });
    rerender(<LocationSearch label="장소 검색" onSelect={onSelect} />);
    fireEvent.keyDown(input, { key: "Enter" });

    expect(input).not.toHaveAttribute("aria-activedescendant");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("같은 종류의 그룹도 고유한 제목 id로 연결한다", () => {
    render(
      <>
        <LocationGroup kind="origin" title="출발지 하나" locations={[]} onSelectLocation={() => undefined} onRemove={() => undefined} onAdd={() => undefined} />
        <LocationGroup kind="origin" title="출발지 둘" locations={[]} onSelectLocation={() => undefined} onRemove={() => undefined} onAdd={() => undefined} />
      </>,
    );

    const groups = screen.getAllByRole("region");
    const labelledBy = groups.map((group) => group.getAttribute("aria-labelledby"));
    expect(new Set(labelledBy).size).toBe(2);
    labelledBy.forEach((id) => expect(document.getElementById(id ?? "")).toBeTruthy());
  });

  it("결과 없음과 인라인 오류를 각각 안내한다", () => {
    Object.assign(searchState, {
      query: "없는 장소",
      results: [],
      isOpen: true,
      hasSearched: true,
      error: null,
    });
    const { rerender } = render(<LocationSearch label="장소 검색" onSelect={() => undefined} />);
    expect(screen.getByText("검색 결과가 없습니다. 다른 키워드로 시도해 보세요.")).toBeVisible();

    Object.assign(searchState, { error: "장소 검색 중 오류가 발생했습니다.", isOpen: false });
    rerender(<LocationSearch label="장소 검색" onSelect={() => undefined} />);
    expect(screen.getByRole("alert")).toHaveTextContent("장소 검색 중 오류가 발생했습니다.");
  });

  it("제어형 패널은 경로 수 CTA와 의존 컴포넌트를 렌더링한다", () => {
    render(
      <LocationPanel
        starts={[makeLocation("s1", "홍대"), makeLocation("s2", "강남")]}
        ends={[makeLocation("e1", "성수"), makeLocation("e2", "종로"), makeLocation("e3", "잠실")]}
        onAddStart={() => undefined}
        onAddEnd={() => undefined}
        onRemoveStart={() => undefined}
        onRemoveEnd={() => undefined}
        onSelectStart={() => undefined}
        onSelectEnd={() => undefined}
        onCalculate={() => undefined}
      />,
    );

    expect(screen.getByText("시간 필터")).toBeVisible();
    expect(screen.getByText("공유 버튼")).toBeVisible();
    expect(screen.getByRole("button", { name: "6개 경로 비교하기" })).toBeEnabled();
  });
});
