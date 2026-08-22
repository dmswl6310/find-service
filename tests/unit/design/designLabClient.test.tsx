import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useLocationSearch = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("scenario=input"),
}));

vi.mock("@/hooks/useLocationSearch", () => ({
  useLocationSearch,
}));

vi.mock("@/components/search/TimeFilter", () => ({ default: () => <div>시간 필터</div> }));
vi.mock("@/components/search/ShareButton", () => ({ default: () => <div>공유 버튼</div> }));

import DesignLabClient from "@/app/design-lab/DesignLabClient";

describe("Design Lab 입력 시나리오", () => {
  beforeEach(() => {
    useLocationSearch.mockReturnValue({
      query: "",
      setQuery: vi.fn(),
      results: [],
      isLoading: false,
      isOpen: false,
      setIsOpen: vi.fn(),
      error: null,
      hasSearched: false,
    });
    useLocationSearch.mockClear();
  });

  it("고정 검색 입력은 비활성화되어 검색 훅을 호출하지 않는다", () => {
    render(<DesignLabClient />);

    const searchInputs = screen.getAllByRole("textbox");
    searchInputs.forEach((input) => {
      expect(input).toBeDisabled();
      fireEvent.change(input, { target: { value: "강남역" } });
      expect(input).toHaveValue("");
    });
    expect(useLocationSearch).not.toHaveBeenCalled();
  });
});
