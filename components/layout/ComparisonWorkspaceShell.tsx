import type { ReactNode } from "react";
import BottomSheet from "@/components/ui/BottomSheet";

export interface ComparisonWorkspaceShellProps {
  accessibleLabel: string;
  panel: ReactNode;
  map: ReactNode;
  headingLevel?: "h1" | "h2";
  panelTestId?: string;
  mapTestId?: string;
  children?: ReactNode;
}

export default function ComparisonWorkspaceShell({
  accessibleLabel,
  panel,
  map,
  headingLevel = "h1",
  panelTestId,
  mapTestId,
  children,
}: ComparisonWorkspaceShellProps) {
  const Heading = headingLevel;

  return (
    <section
      aria-label={accessibleLabel}
      className="relative isolate grid h-[calc(100svh-4rem)] min-h-[640px] min-w-0 overflow-hidden bg-canvas md:grid-cols-[minmax(320px,360px)_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)]"
    >
      <aside
        data-testid={panelTestId}
        className="absolute inset-x-0 bottom-0 z-20 min-w-0 md:static md:col-start-1 md:row-start-1 md:h-full md:min-h-0"
      >
        <BottomSheet
          title="비교 패널"
          className="max-h-[72svh] overflow-y-auto md:h-full md:max-h-none md:overflow-y-auto md:rounded-none md:border-x-0 md:border-b-0 md:shadow-none"
        >
          <div className="min-w-0 p-4 sm:p-5">
            <header className="mb-5 border-b border-border pb-5">
              <p className="text-xs font-semibold text-action">대중교통 약속 장소 비교</p>
              <Heading className="mt-2 text-2xl font-semibold leading-tight text-text">
                어디서 만나는 게 가장 균형 잡힐까요?
              </Heading>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                출발지와 후보지를 추가하면 이동시간의 균형을 비교합니다.
              </p>
            </header>
            {panel}
          </div>
        </BottomSheet>
      </aside>

      <section
        data-testid={mapTestId}
        aria-label="출발지와 후보지 지도"
        className="absolute inset-0 z-0 min-h-0 min-w-0 p-3 pb-0 md:relative md:col-start-2 md:row-start-1 md:p-4"
      >
        {map}
      </section>

      {children}
    </section>
  );
}
