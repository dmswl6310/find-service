import type { Route } from "@playwright/test";
import { expect, test } from "@playwright/test";

// AI 추천 흐름 전체: 출발지 2곳 → AI로 찾기 → 목적 입력 → 2곳 선택 → 추가 → 목적지 목록에 들어감.
// /api/search·/api/suggest는 가짜 응답이라 Claude·카카오·ODsay를 한 번도 부르지 않는다.
test("AI 추천 후보를 골라 목적지 후보에 추가한다", async ({ page }) => {
  await page.route("**/api/search?**", async (route: Route) => {
    const query = new URL(route.request().url()).searchParams.get("q") || "";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        meta: { total_count: 1, pageable_count: 1, is_end: true },
        documents: [
          {
            address_name: "서울",
            id: `${query}-id`,
            place_name: `${query}-result`,
            road_address_name: "서울",
            x: query === "강남" ? "127.0276" : "126.9237",
            y: query === "강남" ? "37.4979" : "37.5563",
          },
        ],
      }),
    });
  });

  const captured: { body?: { purpose?: string; starts?: unknown[] } } = {};
  await page.route("**/api/suggest", async (route: Route) => {
    captured.body = route.request().postDataJSON();
    const station = (id: string, name: string, x: string, y: string) => ({
      id,
      place_name: name,
      address_name: "서울",
      road_address_name: "서울",
      x,
      y,
    });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        candidates: [
          { station: station("st-1", "용산역 경의중앙선", "126.9648", "37.5298"), reason: "활기찬 분위기" },
          { station: station("st-2", "삼각지역 4호선", "126.9731", "37.5347"), reason: "조용한 골목 식당" },
          { station: station("st-3", "공덕역 5호선", "126.9515", "37.5443"), reason: "회식 장소가 많음" },
        ],
      }),
    });
  });

  await page.goto("/");

  for (const query of ["강남", "홍대"]) {
    await page.getByPlaceholder("출발지 추가").fill(query);
    await page.getByText(`${query}-result`, { exact: true }).click();
  }

  await page.getByRole("button", { name: "✨ AI로 찾기" }).click();
  const dialog = page.getByRole("dialog", { name: "AI로 목적지 후보 찾기" });
  await dialog.getByLabel("모임 목적").fill("4명 저녁 회식");
  await dialog.getByRole("button", { name: "AI로 후보 3곳 찾기" }).click();

  await expect(dialog.getByText("조용한 골목 식당")).toBeVisible();
  expect(captured.body).toMatchObject({ purpose: "4명 저녁 회식" });
  expect(captured.body?.starts).toHaveLength(2);

  await dialog.getByRole("button", { name: "용산역 선택" }).click();
  await dialog.getByRole("button", { name: "삼각지역 선택" }).click();
  await dialog.getByRole("button", { name: "선택한 2곳 추가" }).click();

  await expect(dialog).toBeHidden();
  const candidateGroup = page.getByRole("region", { name: "목적지 후보" });
  await expect(candidateGroup.getByText("용산역", { exact: true })).toBeVisible();
  await expect(candidateGroup.getByText("삼각지역", { exact: true })).toBeVisible();
  await expect(candidateGroup.getByText("공덕역", { exact: true })).toHaveCount(0);
});
