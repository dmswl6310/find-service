"use client";

import { useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Progress from "@/components/ui/Progress";
import InlineNotice from "@/components/ui/InlineNotice";
import BottomSheet from "@/components/ui/BottomSheet";
import PlaceRow from "@/components/location/PlaceRow";
import { designLabFixtures } from "@/components/design-lab/fixtures";

type PlaceStateExampleProps = {
  title: string;
  locations: typeof designLabFixtures.starts;
  selectedId?: string;
};

function PlaceStateExample({ title, locations, selectedId }: PlaceStateExampleProps) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4" aria-labelledby={`${title}-heading`}>
      <h3 id={`${title}-heading`} className="text-base font-semibold text-text">장소 상태: {title}</h3>
      <ul className="mt-3 flex min-h-16 flex-col gap-2 rounded-lg border border-dashed border-border bg-surface-raised p-3">
        {locations.map((location, index) => (
          <PlaceRow
            key={location.id}
            location={location}
            kind="origin"
            index={index}
            selected={selectedId === location.id}
            onSelect={() => undefined}
            onRemove={() => undefined}
          />
        ))}
        {locations.length === 0 && <li className="py-2 text-sm text-text-muted">친구들이 출발하는 역이나 장소를 추가해 주세요.</li>}
      </ul>
    </section>
  );
}

export default function DesignLabClient() {
  const scenario = useSearchParams().get("scenario");

  if (scenario !== "foundation") {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 md:px-8">
        <h1 className="text-3xl font-bold text-text">Design Lab</h1>
        <p className="mt-3 text-text-muted">foundation 시나리오만 사용할 수 있습니다.</p>
      </main>
    );
  }

  const partialFailureCount = designLabFixtures.partialFailureMatrix.filter((route) => route.error).length;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-10 sm:px-6 md:px-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold text-info">foundation</p>
        <h1 className="text-3xl font-bold tracking-tight text-text">Design Lab</h1>
        <p className="max-w-2xl text-text-muted">
          외부 API 없이 고정 데이터와 승인된 시맨틱 토큰으로 구성 요소를 점검하는 개발 전용 화면입니다.
        </p>
      </header>

      <section aria-labelledby="tokens-heading" className="rounded-xl border border-border bg-surface p-5">
        <h2 id="tokens-heading" className="text-lg font-semibold text-text">Task 2 토큰</h2>
        <p className="mt-2 text-sm text-text-muted">canvas, surface, action, origin, candidate, balance, success, warning, danger, info</p>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="시맨틱 색상 토큰 견본">
          <span className="rounded-full bg-origin-soft px-3 py-1 text-sm text-origin">출발지</span>
          <span className="rounded-full bg-candidate-soft px-3 py-1 text-sm text-candidate">후보지</span>
          <span className="rounded-full bg-balance-soft px-3 py-1 text-sm text-balance">균형</span>
        </div>
      </section>

      <section aria-labelledby="controls-heading" className="rounded-xl border border-border bg-surface p-5">
        <h2 id="controls-heading" className="text-lg font-semibold text-text">Task 3 Button / IconButton</h2>
        <div className="mt-4 flex items-center gap-3">
          <Button type="button">주요 동작</Button>
          <IconButton aria-label="설정 열기" type="button" variant="secondary">⚙</IconButton>
        </div>
      </section>

      <section aria-labelledby="feedback-heading" className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <h2 id="feedback-heading" className="text-lg font-semibold text-text">Task 4 Progress / InlineNotice / BottomSheet</h2>
        <Progress value={6} max={9} label="경로 계산 진행률" />
        <p className="text-sm text-text-muted">출발지 3개, 후보지 3개, 성공 경로 9개를 고정으로 제공합니다.</p>
        <InlineNotice tone="warning" title="부분 실패 매트릭스">
          {partialFailureCount}개 경로가 실패해도 나머지 성공 결과는 유지합니다.
        </InlineNotice>
        <BottomSheet title="고정 결과 미리보기" className="p-5">
          <p className="font-medium text-text">foundation 고정 문구</p>
          <p className="mt-1 text-sm text-text-muted">네트워크 요청 없이 결정적인 fixture만 사용합니다.</p>
        </BottomSheet>
      </section>

      <section aria-labelledby="locations-heading" className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <h2 id="locations-heading" className="text-lg font-semibold text-text">Task 6 장소 입력 상태</h2>
        <p className="text-sm text-text-muted">모든 사례는 네트워크 요청 없이 고정 fixture와 정적 표현만 사용합니다.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <PlaceStateExample title="비어 있음" locations={[]} />
          <PlaceStateExample title="1개" locations={[designLabFixtures.starts[0]]} />
          <PlaceStateExample title="3개" locations={designLabFixtures.starts} />
          <PlaceStateExample title="선택됨" locations={designLabFixtures.starts} selectedId={designLabFixtures.starts[1].id} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <section className="rounded-xl border border-border bg-surface-raised p-4" aria-labelledby="loading-search-heading">
            <h3 id="loading-search-heading" className="text-base font-semibold text-text">검색 중</h3>
            <div className="mt-3 flex items-center gap-2 text-sm text-text-muted" role="status" aria-label="장소 검색 중">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-origin border-t-transparent" aria-hidden="true" />
              장소를 검색하고 있습니다.
            </div>
          </section>
          <section className="rounded-xl border border-border bg-surface-raised p-4" aria-labelledby="empty-search-heading">
            <h3 id="empty-search-heading" className="text-base font-semibold text-text">검색 결과 없음</h3>
            <p className="mt-3 text-sm text-text-muted">검색 결과가 없습니다. 다른 키워드로 시도해 보세요.</p>
          </section>
          <section className="rounded-xl border border-danger bg-surface-raised p-4" aria-labelledby="error-search-heading">
            <h3 id="error-search-heading" className="text-base font-semibold text-text">검색 오류</h3>
            <p className="mt-3 text-sm text-danger" role="alert">장소 검색 중 오류가 발생했습니다.</p>
          </section>
        </div>
      </section>
    </main>
  );
}
