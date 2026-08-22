import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import { TimeFilterView } from "@/components/search/TimeFilter";
import { ShareButtonView } from "@/components/search/ShareButton";

describe("UI 컨트롤", () => {
  it("로딩 중인 주요 버튼의 상태를 알리고 기존 접근 가능한 이름을 유지한다", () => {
    render(<Button isLoading>9개 경로 비교하기</Button>);

    expect(screen.getByRole("button", { name: "9개 경로 비교하기" })).toBeDisabled();
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  });

  it("아이콘 버튼 호출부에 접근 가능한 이름을 요구한다", () => {
    render(<IconButton aria-label="장소 제거">×</IconButton>);

    expect(screen.getByRole("button", { name: "장소 제거" })).toBeVisible();
  });

  it("아이콘 버튼 크기를 변형별 고정 정사각형으로 적용한다", () => {
    render(
      <>
        <IconButton aria-label="중간" data-testid="icon-md" variant="primary" size="md">
          내용이 긴 아이콘
        </IconButton>
        <IconButton aria-label="작은" data-testid="icon-sm" variant="ghost" size="sm">
          작은 아이콘
        </IconButton>
      </>,
    );

    expect(screen.getByTestId("icon-md")).toHaveClass("h-11", "w-11");
    expect(screen.getByTestId("icon-sm")).toHaveClass("h-9", "w-9");
  });

  it("네이티브 버튼 속성과 시맨틱 danger 스타일을 전달한다", () => {
    const onClick = vi.fn();
    render(
      <Button
        aria-label="장소 삭제"
        data-testid="danger-button"
        name="delete"
        onClick={onClick}
        type="submit"
        variant="danger"
      >
        삭제
      </Button>,
    );

    const button = screen.getByTestId("danger-button");
    expect(button).toHaveAttribute("name", "delete");
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveClass("bg-danger", "text-action-foreground");
    expect(button).not.toHaveClass("text-white");
    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("시간·공유 컨트롤은 8px 반경의 평면 입력 표면을 사용한다", () => {
    const { container } = render(
      <>
        <TimeFilterView
          useDepartureTime
          targetDate="20260823"
          targetTime="1230"
          onUseDepartureTimeChange={() => undefined}
          onTargetDateChange={() => undefined}
          onTargetTimeChange={() => undefined}
          onResetToNow={() => undefined}
        />
        <ShareButtonView canShare onShare={() => undefined} />
      </>,
    );

    const timeSurface = container.querySelector(".mb-4");
    expect(timeSurface).toHaveClass("rounded-lg");
    expect(timeSurface).not.toHaveClass("rounded-2xl", "shadow-sm");
    for (const control of [
      screen.getByRole("button", { name: /켜짐/ }),
      screen.getByLabelText("출발 날짜"),
      screen.getByLabelText("출발 시간"),
      screen.getByRole("button", { name: "현재 시간" }),
      screen.getByRole("button", { name: "결과 공유 링크 복사" }),
    ]) {
      expect(control).toHaveClass("rounded-lg");
      expect(control).not.toHaveClass("rounded-xl", "shadow-sm");
    }
  });
});
