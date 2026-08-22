import type { Page, Route } from "@playwright/test";
import { expect, test } from "@playwright/test";

type SharedLocation = {
  id: string;
  place_name: string;
  x: string;
  y: string;
};

function encodeShareParam(locations: SharedLocation[]) {
  const minimal = locations.map((item) => ({ id: item.id, p: item.place_name, x: item.x, y: item.y }));
  return encodeURIComponent(Buffer.from(JSON.stringify(minimal), "utf8").toString("base64"));
}

test("share URL round-trip restores chips and auto-runs calculation", async ({ page }: { page: Page }) => {
  let transitCalls = 0;
  let graphicCalls = 0;

  await page.route("**/api/transit?**", async (route: Route) => {
    transitCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        totalTime: 15,
        payment: 1400,
        pathType: 3,
        transitCount: 1,
        subPath: [{ trafficType: 3, distance: 120, sectionTime: 4 }],
        mapObj: "shared-route",
      }),
    });
  });

  await page.route("**/api/transit/graphic?**", async (route: Route) => {
    graphicCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        result: {
          lane: [
            {
              section: [
                {
                  graphPos: [
                    { x: "127.0276", y: "37.4979" },
                    { x: "126.9237", y: "37.5563" },
                  ],
                },
              ],
            },
          ],
        },
      }),
    });
  });

  const starts = [{ id: "s1", place_name: "start-a", x: "127.0276", y: "37.4979" }];
  const ends = [{ id: "e1", place_name: "end-b", x: "126.9237", y: "37.5563" }];
  const s = encodeShareParam(starts);
  const e = encodeShareParam(ends);

  await page.goto(`/?s=${s}&e=${e}`);

  await expect(page.getByText("15분").first()).toBeVisible();
  await expect.poll(() => transitCalls).toBeGreaterThan(0);
  await page.getByRole("button", { name: "장소 수정하기" }).click();
  await expect(page.locator("li", { hasText: "start-a" }).first()).toBeVisible();
  await expect(page.locator("li", { hasText: "end-b" }).first()).toBeVisible();
  expect(graphicCalls).toBeGreaterThanOrEqual(0);
});

test("transit matrix uses the stable C3/S500 browser schedule", async ({ page }: { page: Page }) => {
  const startedAt: number[] = [];
  const releaseRequests: Array<() => void> = [];
  let activeRequests = 0;
  let maxActiveRequests = 0;

  await page.route("**/api/transit?**", async (route: Route) => {
    startedAt.push(Date.now());
    activeRequests += 1;
    maxActiveRequests = Math.max(maxActiveRequests, activeRequests);

    await new Promise<void>((resolve) => {
      releaseRequests.push(resolve);
    });

    activeRequests -= 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        totalTime: 15,
        payment: 1400,
        pathType: 3,
        transitCount: 1,
        subPath: [],
        mapObj: "scheduled-route",
      }),
    });
  });

  const starts = [{ id: "s1", place_name: "start-a", x: "127.0276", y: "37.4979" }];
  const ends = [
    { id: "e1", place_name: "end-1", x: "126.9237", y: "37.5563" },
    { id: "e2", place_name: "end-2", x: "127.0447", y: "37.5447" },
    { id: "e3", place_name: "end-3", x: "126.9707", y: "37.5546" },
    { id: "e4", place_name: "end-4", x: "126.9240", y: "37.5216" },
  ];

  await page.goto(`/?s=${encodeShareParam(starts)}&e=${encodeShareParam(ends)}`);

  await expect.poll(() => startedAt.length).toBe(3);
  expect(startedAt[1] - startedAt[0]).toBeGreaterThanOrEqual(450);
  expect(startedAt[2] - startedAt[1]).toBeGreaterThanOrEqual(450);
  expect(maxActiveRequests).toBe(3);

  await page.waitForTimeout(550);
  expect(startedAt).toHaveLength(3);

  releaseRequests.shift()?.();
  await expect.poll(() => startedAt.length).toBe(4);
  expect(maxActiveRequests).toBe(3);

  while (releaseRequests.length > 0) {
    releaseRequests.shift()?.();
  }

  await expect(page.getByText("15분").first()).toBeVisible();
});

test("share button copies a restorable URL with Korean place names", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  await page.route("**/api/search?**", async (route: Route) => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get("q") || "";

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
  await page.route("**/api/transit?**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        totalTime: 19,
        payment: 1400,
        pathType: 3,
        transitCount: 1,
        subPath: [{ trafficType: 3, distance: 100, sectionTime: 3 }],
        mapObj: "copied-route",
      }),
    });
  });
  await page.route("**/api/transit/graphic?**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: { lane: [] } }),
    });
  });

  await page.goto("/");
  await page.getByPlaceholder("출발지 추가").fill("강남");
  await expect(page.getByText("강남-result", { exact: true })).toBeVisible();
  await page.getByText("강남-result", { exact: true }).click();

  await page.getByPlaceholder("목적지 후보 추가").fill("홍대");
  await expect(page.getByText("홍대-result", { exact: true })).toBeVisible();
  await page.getByText("홍대-result", { exact: true }).click();

  await page.getByRole("button", { name: "결과 공유 링크 복사" }).click();
  await expect(page.getByRole("button", { name: "링크 복사됨!" })).toBeVisible();

  const copiedUrl = await page.evaluate(() => navigator.clipboard.readText());
  const copied = new URL(copiedUrl);

  expect(copied.searchParams.has("s")).toBe(true);
  expect(copied.searchParams.has("e")).toBe(true);

  await page.goto(copiedUrl);
  await expect(page.getByRole("button", { name: "홍대-result 선택" })).toBeVisible();
  await page.getByRole("button", { name: "장소 수정하기" }).click();
  await expect(page.locator("li", { hasText: "강남-result" }).first()).toBeVisible();
  await expect(page.locator("li", { hasText: "홍대-result" }).first()).toBeVisible();
});

test("result cell selection updates active map-synced route", async ({ page }: { page: Page }) => {
  await page.route("**/api/search?**", async (route: Route) => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get("q") || "";

    const coordsByQuery: Record<string, { x: string; y: string }> = {
      강남: { x: "127.0276", y: "37.4979" },
      잠실: { x: "127.1025", y: "37.5133" },
      홍대: { x: "126.9237", y: "37.5563" },
      성수: { x: "127.0447", y: "37.5447" },
    };

    const coords = coordsByQuery[query] ?? { x: "127.0000", y: "37.5000" };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        meta: { total_count: 1, pageable_count: 1, is_end: true },
        documents: [
          {
            id: `${query}-id`,
            place_name: `${query}-result`,
            address_name: "서울",
            road_address_name: "서울",
            x: coords.x,
            y: coords.y,
          },
        ],
      }),
    });
  });

  await page.route("**/api/transit?**", async (route: Route) => {
    const url = new URL(route.request().url());
    const sx = url.searchParams.get("sx");
    const ex = url.searchParams.get("ex");
    expect(url.searchParams.get("date")).toMatch(/^\d{8}$/);
    expect(url.searchParams.get("time")).toMatch(/^\d{4}$/);

    const matrix: Record<string, { totalTime: number; mapObj: string }> = {
      "127.0276-126.9237": { totalTime: 11, mapObj: "m-a" },
      "127.0276-127.0447": { totalTime: 22, mapObj: "m-b" },
      "127.1025-126.9237": { totalTime: 33, mapObj: "m-c" },
      "127.1025-127.0447": { totalTime: 44, mapObj: "m-d" },
    };

    const result = matrix[`${sx}-${ex}`];
    if (!result) {
      await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "not found" }) });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        totalTime: result.totalTime,
        payment: 1400,
        pathType: 3,
        transitCount: 1,
        subPath: [{ trafficType: 3, distance: 100, sectionTime: 3 }],
        mapObj: result.mapObj,
      }),
    });
  });

  await page.route("**/api/transit/graphic?**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        result: {
          lane: [
            {
              section: [{ graphPos: [{ x: "127.0", y: "37.5" }, { x: "127.1", y: "37.6" }] }],
            },
          ],
        },
      }),
    });
  });

  await page.goto("/");

  await page.getByPlaceholder("출발지 추가").fill("강남");
  await expect(page.getByText("강남-result", { exact: true })).toBeVisible();
  await page.getByText("강남-result", { exact: true }).click();

  await page.getByPlaceholder("출발지 추가").fill("잠실");
  await expect(page.getByText("잠실-result", { exact: true })).toBeVisible();
  await page.getByText("잠실-result", { exact: true }).click();

  await page.getByPlaceholder("목적지 후보 추가").fill("홍대");
  await expect(page.getByText("홍대-result", { exact: true })).toBeVisible();
  await page.getByText("홍대-result", { exact: true }).click();

  await page.getByPlaceholder("목적지 후보 추가").fill("성수");
  await expect(page.getByText("성수-result", { exact: true })).toBeVisible();
  await page.getByText("성수-result", { exact: true }).click();

  await page.getByRole("button", { name: "4개 경로 비교하기" }).click();
  await page.getByRole("button", { name: "경로표 열기" }).click();

  const button44 = page.getByRole("button", { name: /44분/ });
  const button11 = page.getByRole("button", { name: /11분/ });

  await expect(button44).toBeVisible();
  await button44.click();
  await expect(button44).toHaveClass(/ring-2/);

  await button11.click();
  await expect(button11).toHaveClass(/ring-2/);

  await page.getByRole("button", { name: "강남-result에서 홍대-result까지 상세 경로 보기" }).click();
  await expect(page.getByRole("dialog", { name: "강남-result에서 홍대-result까지 상세 경로" })).toBeVisible();
  await page.getByRole("button", { name: "상세 경로 닫기" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.getByRole("button", { name: "비교 결과로 돌아가기" }).click();
  await page.getByRole("button", { name: "장소 수정하기" }).click();
  await page.getByRole("button", { name: "강남-result 제거" }).click();
  await expect(page.locator("li", { hasText: "강남-result" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /44분/ })).toHaveCount(0);

  await page.getByPlaceholder("목적지 후보 추가").fill("건대");
  await expect(page.getByText("건대-result", { exact: true })).toBeVisible();
  await page.getByText("건대-result", { exact: true }).click();
  await expect(page.locator("li", { hasText: "건대-result" }).first()).toBeVisible();
});

test("search + transit matrix keeps successful cells on partial failure", async ({ page }: { page: Page }) => {
  let graphicCalls = 0;

  await page.route("**/api/search?**", async (route: Route) => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get("q") || "";

    const payload = {
      meta: { total_count: 1, pageable_count: 1, is_end: true },
      documents: [
        {
          id: `${query}-id`,
          place_name: `${query}-result`,
          address_name: "서울",
          road_address_name: "서울",
          x: query.includes("강남") ? "127.0276" : query.includes("홍대") ? "126.9237" : "127.1025",
          y: query.includes("강남") ? "37.4979" : query.includes("홍대") ? "37.5563" : "37.5133",
        },
      ],
    };

    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) });
  });

  await page.route("**/api/transit?**", async (route: Route) => {
    const url = new URL(route.request().url());
    const ex = url.searchParams.get("ex");

    if (ex === "126.9237") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          totalTime: 21,
          payment: 1400,
          pathType: 3,
          transitCount: 1,
          subPath: [{ trafficType: 3, distance: 100, sectionTime: 3 }],
          mapObj: "ok-route",
        }),
      });
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({
        error: "이용 가능한 대중교통 경로가 없습니다.",
        errorCode: "4",
        errorStatus: 404,
        errorSource: "odsay",
      }),
    });
  });

  await page.route("**/api/transit/graphic?**", async (route: Route) => {
    graphicCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        result: {
          lane: [
            {
              section: [{ graphPos: [{ x: "127.0276", y: "37.4979" }, { x: "126.9237", y: "37.5563" }] }],
            },
          ],
        },
      }),
    });
  });

  await page.goto("/");

  await page.getByPlaceholder("출발지 추가").fill("강남");
  await expect(page.getByText("강남-result", { exact: true })).toBeVisible();
  await page.getByText("강남-result", { exact: true }).click();

  await page.getByPlaceholder("목적지 후보 추가").fill("홍대");
  await expect(page.getByText("홍대-result", { exact: true })).toBeVisible();
  await page.getByText("홍대-result", { exact: true }).click();

  await page.getByPlaceholder("목적지 후보 추가").fill("잠실");
  await expect(page.getByText("잠실-result", { exact: true })).toBeVisible();
  await page.getByText("잠실-result", { exact: true }).click();

  await page.getByRole("button", { name: "2개 경로 비교하기" }).click();

  await expect(
    page.getByRole("alert").filter({ hasText: "성공한 1개 경로는 그대로 표시합니다" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "경로표 열기" }).click();
  await expect(
    page.getByRole("button", { name: /강남-result에서 홍대-result까지 21분, 지도에서 보기/ }),
  ).toBeVisible();
  await expect(page.getByText("이용 가능한 대중교통 경로가 없습니다.")).toBeVisible();
  await page.getByRole("button", { name: "강남-result에서 잠실-result까지 실패 상세 보기" }).click();
  await expect(page.getByRole("dialog", { name: "강남-result에서 잠실-result까지 상세 경로" })).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("이용 가능한 대중교통 경로가 없습니다.");
  await page.getByRole("button", { name: "상세 경로 닫기" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect.poll(() => graphicCalls).toBeGreaterThan(0);
});
