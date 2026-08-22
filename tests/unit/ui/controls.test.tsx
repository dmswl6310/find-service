import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";

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
});
