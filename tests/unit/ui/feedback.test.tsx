import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Progress from "@/components/ui/Progress";
import InlineNotice from "@/components/ui/InlineNotice";
import BottomSheet from "@/components/ui/BottomSheet";

describe("UI 피드백과 바텀시트", () => {
  it("확정형 진행률을 알린다", () => {
    render(<Progress value={6} max={9} label="경로 계산" />);
    expect(screen.getByRole("progressbar", { name: "경로 계산" })).toHaveAttribute("aria-valuenow", "6");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuemin", "0");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuemax", "9");
  });

  it("진행률 값을 0과 max 사이로 고정하고 max가 0이어도 안전하다", () => {
    const { rerender } = render(<Progress value={-4} max={9} label="낮음" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    rerender(<Progress value={12} max={9} label="높음" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "9");
    rerender(<Progress value={1} max={0} label="비어 있음" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("위험 notice는 alert이고 정보·주의 notice는 status다", () => {
    const { rerender } = render(<InlineNotice tone="danger" title="오류">실패했습니다.</InlineNotice>);
    expect(screen.getByRole("alert")).toHaveTextContent("실패했습니다.");
    expect(screen.getByRole("alert")).toHaveTextContent("오류");
    rerender(<InlineNotice tone="info" title="안내">정보입니다.</InlineNotice>);
    expect(screen.getByRole("status")).toHaveTextContent("안내");
    rerender(<InlineNotice tone="warning" title="주의">주의하세요.</InlineNotice>);
    expect(screen.getByRole("status")).toHaveTextContent("주의");
  });

  it("각 notice tone에 눈에 보이는 제목과 왼쪽 테두리를 제공한다", () => {
    const { rerender } = render(<InlineNotice tone="info" title="안내">내용</InlineNotice>);
    expect(screen.getByText("안내")).toBeVisible();
    expect(screen.getByRole("status")).toHaveClass("border-l-info");
    rerender(<InlineNotice tone="warning" title="주의">내용</InlineNotice>);
    expect(screen.getByText("주의")).toBeVisible();
    expect(screen.getByRole("status")).toHaveClass("border-l-warning");
    rerender(<InlineNotice tone="danger" title="오류">내용</InlineNotice>);
    expect(screen.getByText("오류")).toBeVisible();
    expect(screen.getByRole("alert")).toHaveClass("border-l-danger");
  });

  it("이름이 있는 피드백·시트 영역과 aria-hidden 그랩 핸들을 렌더링한다", () => {
    render(
      <>
        <InlineNotice tone="danger" title="일부 경로 실패">성공 결과는 유지됩니다.</InlineNotice>
        <BottomSheet title="비교 결과" className="추가 클래스">결과</BottomSheet>
      </>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("성공 결과는 유지됩니다.");
    const sheet = screen.getByRole("region", { name: "비교 결과" });
    expect(sheet).toBeVisible();
    expect(sheet).toHaveClass("추가 클래스", "shadow-xl");
    expect(sheet.querySelector('[aria-hidden="true"]')).toHaveClass("bg-border-strong");
  });
});
