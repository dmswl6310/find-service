import { expect, test } from "@playwright/test";

const requiredTokens = {
  "--canvas": "#f3f6f5",
  "--surface": "#ffffff",
  "--surface-raised": "#fbfdfc",
  "--text": "#172625",
  "--text-muted": "#647774",
  "--border": "#d7e1df",
  "--border-strong": "#b9c9c6",
  "--action": "#173f42",
  "--action-hover": "#0f3335",
  "--action-foreground": "#ffffff",
  "--origin": "#397c8a",
  "--origin-soft": "#e6f0f2",
  "--candidate": "#b9604b",
  "--candidate-soft": "#f7ebe7",
  "--balance": "#95651d",
  "--balance-soft": "#f8f1e4",
  "--success": "#2f6b56",
  "--warning": "#8a651e",
  "--danger": "#a44f48",
  "--info": "#397c8a",
};

const runtimeTokens = Object.fromEntries(
  Object.entries(requiredTokens).map(([token, value]) => [
    token,
    value === "#ffffff" ? "#fff" : value,
  ])
);

test("Calm Transit tokens and Pretendard are exposed at runtime", async ({ page }) => {
  await page.goto("/");

  const styles = await page.locator("html").evaluate((element, tokens) => {
    const root = getComputedStyle(element);
    const body = getComputedStyle(document.body);

    return {
      fontVariable: root.getPropertyValue("--font-pretendard").trim(),
      bodyFontFamily: body.fontFamily,
      tokens: Object.fromEntries(
        Object.keys(tokens).map((token) => [token, root.getPropertyValue(token).trim()])
      ),
    };
  }, requiredTokens);

  expect(styles.tokens).toEqual(runtimeTokens);
  expect(styles.fontVariable).not.toBe("");
  expect(styles.bodyFontFamily).toContain(
    styles.fontVariable.split(",")[0].replaceAll('"', "")
  );
  await expect(page.getByRole("link", { name: "모두스팟", exact: true })).toHaveCSS(
    "font-weight",
    "600"
  );
});

test("개발 환경 Design Lab이 고정 기반 컨트롤을 렌더링한다", async ({ page }) => {
  await page.goto("/design-lab?scenario=foundation");

  await expect(page.getByRole("heading", { name: "Design Lab" })).toBeVisible();
  await expect(page.getByRole("button", { name: "주요 동작" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "장소 상태: 비어 있음" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "장소 상태: 1개" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "장소 상태: 3개" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "장소 상태: 선택됨" })).toBeVisible();
  await expect(page.getByText("검색 결과가 없습니다. 다른 키워드로 시도해 보세요.")).toBeVisible();
  await expect(page.getByText("장소 검색 중 오류가 발생했습니다.")).toHaveAttribute("role", "alert");
});

test("Design Lab 지도는 외부 API 없이 고정 표면만 렌더링한다", async ({ page }) => {
  const liveMapRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/") || url.hostname === "dapi.kakao.com") {
      liveMapRequests.push(request.url());
    }
  });

  await page.goto("/design-lab?scenario=foundation");

  await expect(
    page.getByRole("img", { name: "출발지 3곳과 후보지 3곳, 선택 경로가 표시된 고정 지도 미리보기" }),
  ).toBeVisible();
  expect(liveMapRequests).toEqual([]);
});

test("Design Lab 입력 시나리오는 장소 검색 API를 호출하지 않는 고정 입력만 제공한다", async ({ page }) => {
  const searchRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/search") {
      searchRequests.push(request.url());
    }
  });

  await page.goto("/design-lab?scenario=input");

  await expect(page.getByText("고정 fixture 입력으로, 장소 검색을 실행하지 않습니다.")).toHaveCount(2);
  await expect(page.getByRole("textbox", { name: "출발지 검색" })).toBeDisabled();
  await expect(page.getByRole("textbox", { name: "목적지 후보 검색" })).toBeDisabled();
  expect(searchRequests).toEqual([]);
});
