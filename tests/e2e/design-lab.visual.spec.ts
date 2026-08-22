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
  await page.goto("/design-lab?scenario=unknown");

  const scenarioSelect = page.getByLabel("시각 시나리오", { exact: true });
  await expect(scenarioSelect).toHaveValue("foundation");
  await scenarioSelect.selectOption("result");
  await expect(page).toHaveURL(/\/design-lab\?scenario=result$/);
  await expect(scenarioSelect).toHaveValue("result");
});

test("지도 표시는 시나리오의 입력과 결과 상태를 따른다", async ({ page }) => {
  await page.goto("/design-lab?scenario=empty");
  await expect(page.getByLabel("출발지 1", { exact: true })).toBeHidden();
  await expect(page.getByLabel("선택 경로", { exact: true })).toBeHidden();

  await page.goto("/design-lab?scenario=input");
  await expect(page.getByLabel("출발지 1", { exact: true })).toBeVisible();
  await expect(page.getByLabel("선택 경로", { exact: true })).toBeHidden();

  await page.goto("/design-lab?scenario=result");
  await expect(page.getByLabel("선택 경로", { exact: true })).toBeVisible();

  await page.goto("/design-lab?scenario=total-failure");
  await expect(page.getByLabel("선택 경로", { exact: true })).toBeHidden();
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
