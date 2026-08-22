import { expect, test, type Page } from "@playwright/test";

const scenarios = [
  "empty",
  "input",
  "loading",
  "result",
  "partial-failure",
  "total-failure",
] as const;

const fixedNow = "2026-08-22T09:30:00+09:00";

async function prepareScenario(
  page: Page,
  scenario: (typeof scenarios)[number],
  viewport: { width: number; height: number },
) {
  await page.setViewportSize(viewport);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.setFixedTime(new Date(fixedNow));
  await page.goto(`/design-lab?scenario=${scenario}`);
  await page.evaluate(async () => {
    await document.fonts.ready;
    document.querySelectorAll("nextjs-portal").forEach((portal) => portal.remove());
  });

  const widths = await page.evaluate(() => ({
    html: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(widths.html).toBeLessThanOrEqual(widths.viewport);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport);
}

test("알 수 없는 시나리오는 기반 카탈로그로 돌아가고 선택으로 URL을 이동한다", async ({
  page,
}) => {
  await page.goto("/design-lab");
  await expect(page.getByLabel("시각 시나리오", { exact: true })).toHaveValue("foundation");

  await page.goto("/design-lab?scenario=unknown");

  const scenarioSelect = page.getByLabel("시각 시나리오", { exact: true });
  await expect(scenarioSelect).toHaveValue("foundation");
  await scenarioSelect.selectOption("result");
  await expect(page).toHaveURL(/\/design-lab\?scenario=result$/);
  await expect(scenarioSelect).toHaveValue("result");
});

test("모바일 시나리오는 뷰포트에 고정된 독립 스크롤 시트를 사용한다", async ({ page }) => {
  await prepareScenario(page, "result", { width: 390, height: 844 });

  const metrics = await page.evaluate(() => {
    const panel = document.querySelector<HTMLElement>("[data-testid='design-lab-panel']");
    const map = document.querySelector<HTMLElement>("[data-testid='design-lab-map']");
    const workspace = panel?.parentElement;
    const sheet = panel?.firstElementChild as HTMLElement | null;
    if (!panel || !map || !workspace || !sheet) throw new Error("시각 작업공간을 찾지 못했습니다.");

    const panelBox = panel.getBoundingClientRect();
    const mapBox = map.getBoundingClientRect();
    const workspaceBox = workspace.getBoundingClientRect();

    return {
      panelPosition: getComputedStyle(panel).position,
      panelBottom: panelBox.bottom,
      workspaceBottom: workspaceBox.bottom,
      workspaceHeight: workspaceBox.height,
      mapHeight: mapBox.height,
      sheetClientHeight: sheet.clientHeight,
      sheetScrollHeight: sheet.scrollHeight,
    };
  });

  expect(metrics.panelPosition).toBe("absolute");
  expect(Math.abs(metrics.panelBottom - metrics.workspaceBottom)).toBeLessThanOrEqual(1);
  expect(metrics.workspaceHeight).toBeLessThanOrEqual(780);
  expect(metrics.mapHeight).toBe(metrics.workspaceHeight);
  expect(metrics.sheetClientHeight).toBeLessThan(metrics.sheetScrollHeight);
  expect(metrics.sheetClientHeight).toBeLessThanOrEqual(Math.ceil(844 * 0.75));
  expect(metrics.sheetClientHeight).toBeGreaterThanOrEqual(Math.floor(844 * 0.7));
  expect(Math.abs(metrics.sheetClientHeight - Math.round(844 * 0.72))).toBeLessThanOrEqual(2);
});

for (const scenario of ["empty", "input"] as const) {
  test(`${scenario} 모바일 첫 화면에서 출발지 입력을 시작할 수 있다`, async ({ page }) => {
    await prepareScenario(page, scenario, { width: 390, height: 844 });

    const sheet = page.getByRole("region", { name: "비교 패널", exact: true });
    const originHeading = page.getByRole("heading", { name: "출발지", exact: true });
    const originSearch = page.getByRole("textbox", { name: "출발지 검색", exact: true });
    const [sheetBox, headingBox, searchBox] = await Promise.all([
      sheet.boundingBox(),
      originHeading.boundingBox(),
      originSearch.boundingBox(),
    ]);
    expect(sheetBox).not.toBeNull();
    expect(headingBox).not.toBeNull();
    expect(searchBox).not.toBeNull();
    expect(headingBox!.y).toBeGreaterThanOrEqual(sheetBox!.y);
    expect(headingBox!.y + headingBox!.height).toBeLessThanOrEqual(
      sheetBox!.y + sheetBox!.height,
    );
    const visibleSearchHeight = Math.max(
      0,
      Math.min(searchBox!.y + searchBox!.height, sheetBox!.y + sheetBox!.height)
        - Math.max(searchBox!.y, sheetBox!.y),
    );
    expect(visibleSearchHeight).toBeGreaterThanOrEqual(searchBox!.height * 0.6);
  });
}

for (const scenario of ["result", "partial-failure"] as const) {
  test(`${scenario} 모바일 지도 문맥이 72svh 시트 위에 남는다`, async ({ page }) => {
    await prepareScenario(page, scenario, { width: 390, height: 844 });

    const map = page.getByTestId("design-lab-map");
    const sheet = page.getByRole("region", { name: "비교 패널", exact: true });
    const summary = page.getByLabel("선택 후보 요약", { exact: true });
    const origin = map.getByLabel("출발지 1", { exact: true });
    const candidate = map.getByLabel("후보지 A", { exact: true });
    const route = map.getByLabel("선택 경로", { exact: true });

    await expect(summary).toBeInViewport();
    await expect(origin).toBeInViewport();
    await expect(candidate).toBeInViewport();
    await expect(route).toBeInViewport();

    const [sheetBox, summaryBox, originBox, candidateBox, routeBox] = await Promise.all([
      sheet.boundingBox(),
      summary.boundingBox(),
      origin.boundingBox(),
      candidate.boundingBox(),
      route.boundingBox(),
    ]);
    expect(sheetBox).not.toBeNull();
    expect(summaryBox).not.toBeNull();
    expect(originBox).not.toBeNull();
    expect(candidateBox).not.toBeNull();
    expect(routeBox).not.toBeNull();

    const summaryBottom = summaryBox!.y + summaryBox!.height;
    const sheetTop = sheetBox!.y;
    expect(summaryBottom).toBeLessThanOrEqual(sheetTop);
    for (const contextBox of [originBox!, candidateBox!, routeBox!]) {
      expect(contextBox.y).toBeGreaterThanOrEqual(summaryBottom);
      expect(contextBox.y + contextBox.height).toBeLessThanOrEqual(sheetTop);
    }
    expect(routeBox!.width).toBeGreaterThanOrEqual(140);
  });
}

for (const scenario of ["loading", "total-failure"] as const) {
  test(`${scenario} 모바일 지도 marker가 서로 겹치지 않는다`, async ({ page }) => {
    await prepareScenario(page, scenario, { width: 390, height: 844 });
    const markers = page.getByTestId("design-lab-map").locator("[aria-label^='출발지 '], [aria-label^='후보지 ']");
    const boxes = await markers.evaluateAll((elements) =>
      elements.map((element) => {
        const box = element.getBoundingClientRect();
        return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
      }),
    );

    expect(boxes).toHaveLength(6);
    for (let first = 0; first < boxes.length; first += 1) {
      for (let second = first + 1; second < boxes.length; second += 1) {
        const overlaps = !(
          boxes[first].right <= boxes[second].left
          || boxes[second].right <= boxes[first].left
          || boxes[first].bottom <= boxes[second].top
          || boxes[second].bottom <= boxes[first].top
        );
        expect(overlaps, `marker ${first + 1}과 ${second + 1}이 겹칩니다.`).toBe(false);
      }
    }
  });
}

test("좁은 데스크톱 패널에서도 시간 입력 동작이 잘리지 않는다", async ({ page }) => {
  await prepareScenario(page, "input", { width: 1440, height: 1000 });

  const panel = await page.getByTestId("design-lab-panel").boundingBox();
  const resetButton = await page.getByRole("button", { name: "현재 시간" }).boundingBox();
  expect(panel).not.toBeNull();
  expect(resetButton).not.toBeNull();
  expect(resetButton!.x).toBeGreaterThanOrEqual(panel!.x);
  expect(resetButton!.x + resetButton!.width).toBeLessThanOrEqual(panel!.x + panel!.width);
});

test("지도 표시는 시나리오의 입력과 결과 상태를 따른다", async ({ page }) => {
  await page.goto("/design-lab?scenario=empty");
  let map = page.getByTestId("design-lab-map");
  await expect(page.getByRole("img", { name: "빈 상태 지도: 장소와 선택 경로 없음" })).toBeVisible();
  await expect(map.locator("[aria-label^='출발지 ']")).toHaveCount(0);
  await expect(map.locator("[aria-label^='후보지 ']")).toHaveCount(0);
  await expect(page.getByLabel("선택 경로", { exact: true })).toHaveCount(0);

  await page.goto("/design-lab?scenario=input");
  map = page.getByTestId("design-lab-map");
  await expect(page.getByRole("img", { name: "장소 입력 지도: 출발지 3곳과 후보지 3곳, 선택 경로 없음" })).toBeVisible();
  await expect(map.locator("[aria-label^='출발지 ']")).toHaveCount(3);
  await expect(map.locator("[aria-label^='후보지 ']")).toHaveCount(3);
  await expect(page.getByLabel("선택 경로", { exact: true })).toHaveCount(0);

  await page.goto("/design-lab?scenario=loading");
  map = page.getByTestId("design-lab-map");
  await expect(page.getByRole("img", { name: "계산 중 지도: 출발지 3곳과 후보지 3곳, 선택 경로 없음" })).toBeVisible();
  await expect(map.locator("[aria-label^='출발지 ']")).toHaveCount(3);
  await expect(page.getByLabel("선택 경로", { exact: true })).toHaveCount(0);

  await page.goto("/design-lab?scenario=result");
  await expect(page.getByLabel("선택 경로", { exact: true })).toBeVisible();
  await expect(page.getByLabel("선택 후보 요약", { exact: true })).toContainText("평균 34분 · 최장 36분");

  await page.goto("/design-lab?scenario=partial-failure");
  await expect(page.getByLabel("선택 경로", { exact: true })).toBeVisible();
  await expect(page.getByLabel("선택 후보 요약", { exact: true })).toContainText("평균 34분 · 최장 36분");

  await page.goto("/design-lab?scenario=total-failure");
  map = page.getByTestId("design-lab-map");
  await expect(page.getByRole("img", { name: "전체 실패 지도: 출발지 3곳과 후보지 3곳, 선택 경로 없음" })).toBeVisible();
  await expect(map.locator("[aria-label^='출발지 ']")).toHaveCount(3);
  await expect(page.getByLabel("선택 경로", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("선택 후보 요약", { exact: true })).toHaveCount(0);
});

for (const scenario of scenarios) {
  test(`${scenario} 데스크톱 시각 회귀`, async ({ page }) => {
    await prepareScenario(page, scenario, { width: 1440, height: 1000 });
    await expect(page).toHaveScreenshot(`${scenario}-1440.png`, {
      fullPage: true,
      animations: "disabled",
    });
  });

  test(`${scenario} 모바일 시각 회귀`, async ({ page }) => {
    await prepareScenario(page, scenario, { width: 390, height: 844 });
    await expect(page).toHaveScreenshot(`${scenario}-390.png`, {
      fullPage: true,
      animations: "disabled",
    });
  });
}

test("768px에서 고정 폭 패널과 지도가 나란히 전환된다", async ({ page }, testInfo) => {
  await prepareScenario(page, "result", { width: 768, height: 900 });

  const panel = await page.getByTestId("design-lab-panel").boundingBox();
  const map = await page.getByTestId("design-lab-map").boundingBox();
  expect(panel).not.toBeNull();
  expect(map).not.toBeNull();
  expect(panel!.width).toBeGreaterThanOrEqual(320);
  expect(panel!.width).toBeLessThanOrEqual(360);
  expect(map!.x).toBeGreaterThanOrEqual(panel!.x + panel!.width);
  expect(map!.width).toBeGreaterThan(panel!.width);

  await page.screenshot({
    path: testInfo.outputPath("result-768-inspection.png"),
    fullPage: true,
    animations: "disabled",
  });
});
