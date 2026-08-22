# 모두스팟 디자인 시스템

- 방향: Calm Transit
- 상태: 구현됨
- 관련 명세: `docs/superpowers/specs/2026-08-22-moduspot-calm-transit-design.md`

## 1. 원칙

1. 지도와 비교 결과가 장식보다 먼저 보여야 한다.
2. 색은 의미를 전달할 때만 사용한다.
3. 출발지, 후보지, 황금 밸런스의 표현을 화면 전체에서 고정한다.
4. 중첩 카드, 장식용 그라데이션, 이모지, 과도한 굵기를 사용하지 않는다.
5. 한 영역에는 높은 강조 행동을 하나만 둔다.
6. 실패한 일부 경로가 성공한 결과를 숨기지 않게 한다.
7. 모바일은 데스크톱을 축소하지 않고 지도와 바텀시트 구조로 재배치한다.

## 2. 색상 토큰

아래 값은 초기 light theme 계약이다. 컴포넌트에서는 원시 색상이나 Tailwind 팔레트 이름 대신 의미 토큰을 사용한다.

| 토큰 | 값 | 사용 |
| --- | --- | --- |
| `canvas` | `#F3F6F5` | 앱 배경, 입력 내부의 낮은 표면 |
| `surface` | `#FFFFFF` | 패널, 시트, 모달 |
| `surface-raised` | `#FBFDFC` | 떠 있는 보조 표면 |
| `text` | `#172625` | 기본 텍스트 |
| `text-muted` | `#647774` | 보조 설명과 메타데이터 |
| `border` | `#D7E1DF` | 기본 구분선 |
| `border-strong` | `#B9C9C6` | 입력 테두리와 강조 구분선 |
| `action` | `#173F42` | 주요 버튼, 선택, 포커스 계열 |
| `action-hover` | `#0F3335` | 주요 행동 hover |
| `action-foreground` | `#FFFFFF` | 주요 행동 위 텍스트 |
| `origin` | `#397C8A` | 출발지 마커와 식별자 |
| `origin-soft` | `#E6F0F2` | 출발지의 낮은 강조 표면 |
| `candidate` | `#B9604B` | 후보지 마커와 식별자 |
| `candidate-soft` | `#F7EBE7` | 후보지의 낮은 강조 표면 |
| `balance` | `#95651D` | 황금 밸런스 라벨과 강조선 |
| `balance-soft` | `#F8F1E4` | 황금 밸런스 요약 배경 |
| `success` | `#2F6B56` | 완료 상태 |
| `warning` | `#8A651E` | 주의가 필요한 상태 |
| `danger` | `#A44F48` | 오류와 파괴적 행동 |
| `info` | `#397C8A` | 일반 정보 상태 |

### 금지 규칙

- Production 컴포넌트에서 `sky-*`, `emerald-*`, `amber-*`, `red-*` 등 Tailwind 팔레트를 직접 사용하지 않는다.
- 도메인 색을 장식에 사용하지 않는다.
- `balance`를 일반 경고색으로 사용하지 않는다.
- 색만으로 선택, 실패, 장소 종류를 구분하지 않는다.

## 3. 타이포그래피

- 글꼴: self-hosted Pretendard Variable
- 허용 굵기: 400, 500, 600
- Display desktop: 32px / 40px
- Display mobile: 24px / 32px
- Section title: 20px / 28px
- Body: 16px / 24px
- Compact body: 14px / 20px
- Label: 12px / 16px
- 이동시간과 요금: tabular numerals

700 이상의 굵기를 기본 UI에 사용하지 않는다. 크고 굵은 제목을 여러 개 쌓지 않는다.

## 4. 간격, 반경, 그림자

### 간격

기본 간격 스케일은 `4, 8, 12, 16, 24, 32, 48px`이다. 임의의 중간 값을 추가하기 전에 기존 스케일로 해결할 수 있는지 확인한다.

### 반경

- 작은 컨트롤: 6px
- 입력, 버튼, 행: 8px
- 시트와 모달: 12px
- 상태 점과 출발지 마커: 원형
- 후보지 마커: 작은 사각형

모든 컨테이너를 둥근 카드로 만들지 않는다.

### 그림자

그림자는 지도 위 바텀시트, 모달, 팝오버처럼 실제로 떠 있는 표면에만 사용한다. 일반 패널과 반복 행은 테두리와 간격으로 구분한다.

## 5. 도메인 표현

### 출발지

- 색: `origin`
- 형태: 원형
- 식별자: `1, 2, 3...`

### 목적지 후보

- 색: `candidate`
- 형태: 둥근 사각형
- 식별자: `A, B, C...`

### 황금 밸런스

- 이름은 `황금 밸런스`를 유지한다.
- 왕관 이모지와 그라데이션을 사용하지 않는다.
- `balance` 강조선, 작은 라벨, `balance-soft` 표면으로 표현한다.
- 평균과 최장 이동시간을 항상 함께 보여준다.
- 전체 출발지 또는 후보지 수가 도메인 조건보다 적거나, 완전한 후보가 하나도 없으면 표시하지 않는다.

## 6. 공통 컴포넌트 계약

### 일반 UI

- `Button`: primary, secondary, ghost, danger. 각 버튼은 loading과 disabled 이유를 지원한다.
- `IconButton`: 보이는 라벨이 없으면 접근성 이름이 필수다.
- `SearchField`: label, value, loading, empty, error, results를 지원한다.
- `Progress`: 현재 값과 전체 값을 전달하고 화면 읽기 도구에 상태를 알린다.
- `InlineNotice`: info, warning, danger. 제목과 설명을 색 외의 방식으로 구분한다.
- `BottomSheet`: mobile 입력, 결과, 상세 경로에 사용한다.

### 장소 UI

- `LocationGroup`: 종류, 제목, 장소 목록, 추가 행동을 소유한다.
- `LocationSearch`: 검색 동작만 소유하고 앱 전체 장소 상태를 직접 변경하지 않는다.
- `PlaceRow`: 식별자, 장소명, 주소, 선택, 제거를 표현한다.
- `MapMarker`: 장소 종류와 식별자를 받아 일관된 지도 표현을 만든다.

### 결과 UI

- `BalanceSummary`: 후보명, 평균, 최장, 선정 근거를 표시한다.
- `CandidateRankList`: 후보별 평균과 최장을 같은 순서로 표시한다.
- `RouteMatrix`: 데스크톱 상세 비교 전용이다.
- `RouteDetailSheet`: 선택 경로의 노선, 도보, 환승, 요금을 표시한다.
- `CalculationProgress`: 완료 셀, 전체 셀, 현재 후보를 표시한다.
- `PartialFailureNotice`: 성공 결과를 유지하면서 실패 접근점을 제공한다.

### 화면 조립

- `ComparisonWorkspace`: 상태와 레이아웃을 조율한다.
- `LocationPanel`: 입력 상태를 표현한다.
- `ResultPanel`: 결과 요약과 후보 순위를 표현한다.
- `MapWorkspace`: 지도, 마커, 선택 경로, 지도 위 요약을 표현한다.
- `ComparisonWorkspaceShell`: Production과 Design Lab이 함께 사용하는 지도 중심 반응형 셸이다.
- `StaticMapSurface`: Design Lab과 시각 회귀에서만 사용하는 외부 API 없는 고정 지도다.
- `SiteHeader`, `SiteFooter`: 모든 페이지가 공유하는 64px 앱 바와 서비스·정책 내비게이션이다.

표현 컴포넌트 안에서 API를 호출하거나 황금 밸런스를 다시 계산하지 않는다.

### 공유 셸 구현

- 데스크톱 셸은 `minmax(320px, 360px) minmax(0, 1fr)` 열과 `calc(100svh - 4rem)` 높이를 사용한다.
- 모바일은 같은 지도 위에 `BottomSheet` 하나만 올린다. 시트의 최대 높이는 `72svh`이며 시트 내부만 독립적으로 스크롤한다.
- 입력, 계산 중, 결과, 경로표는 같은 패널 슬롯에서 전환하고 실시간 지도는 하나만 유지한다.
- `MapWorkspace`는 Production의 실시간 Kakao 지도, 범례, 선택 후보 요약, 지도 실패 대체 상태를 소유한다.
- `CandidateMapSummary`와 `MapFailureState`는 실시간 지도와 고정 시나리오가 공유하는 상태 표현이다.

## 7. 상태 문구 기준

- 빈 상태: 다음 행동을 한 문장으로 설명한다.
- 입력 상태: 추가된 장소 수와 계산될 경로 수를 명확히 보여준다.
- 계산 중: `완료 / 전체`를 표시한다.
- 성공: 황금 밸런스, 평균, 최장, 후보 순서로 보여준다.
- 부분 실패: 성공 결과를 먼저 유지하고 실패 항목에 구체적인 이유를 연결한다.
- 전체 실패: 입력을 유지하고 다시 계산 행동을 제공한다.

과장된 문구, 불필요한 감탄사, 장식용 이모지를 사용하지 않는다.

## 8. 반응형 기준

### 1440px

- 한 줄 헤더
- 약 360px의 왼쪽 패널
- 나머지 영역을 지도가 사용
- 결과 패널 전환 시 지도 위치 유지
- 상세 매트릭스는 요청 시 표시

### 390px

- 한 줄 앱바
- 지도 위 바텀시트
- 입력, 계산, 결과 상태에 따라 시트 콘텐츠 전환
- 매트릭스 대신 후보 목록을 기본 사용
- 주요 터치 대상은 최소 44px을 목표로 함

### 최소 폭

320px에서 콘텐츠 잘림과 페이지 전체 가로 스크롤이 없어야 한다.

## 9. Design Lab 유지 규칙

- `/design-lab`은 개발 환경에서만 접근 가능해야 한다.
- 실제 API와 외부 지도에 의존하지 않는다.
- Production과 동일한 컴포넌트를 사용한다.
- 토큰, 일반 UI, 장소 UI, 결과 UI, 전체 상태를 구분해 보여준다.
- 빈 상태, 입력 완료, 계산 중, 성공, 부분 실패, 전체 실패를 재현한다.
- 390px, 768px, 1440px 시나리오를 제공한다.
- 새 공통 컴포넌트 또는 새 variant를 추가하면 Design Lab 사례도 함께 추가한다.
- 시각 회귀 테스트는 Design Lab의 고정 시나리오를 캡처한다.

### 시나리오 URL

개발 서버에서 아래 URL을 직접 열면 같은 상태를 반복해서 확인할 수 있다.

- 기반 카탈로그: `/design-lab?scenario=foundation`
- 빈 상태: `/design-lab?scenario=empty`
- 입력 완료: `/design-lab?scenario=input`
- 계산 중: `/design-lab?scenario=loading`
- 비교 결과: `/design-lab?scenario=result`
- 부분 실패: `/design-lab?scenario=partial-failure`
- 전체 실패: `/design-lab?scenario=total-failure`

`NODE_ENV=production`에서는 `/design-lab`과 위 쿼리 URL 모두 `notFound()`를 통해 HTTP 404를 반환한다.

## 10. 색상 계약 검사와 예외

- `npm run lint:colors`는 `app`, `components` 아래의 모든 `.ts`, `.tsx`를 재귀 검사한다.
- 검사기는 raw source에 완성된 literal token으로 존재해 Tailwind가 추출할 수 있는 직접 팔레트 색상과 `white`·`black`, compound를 포함한 직접 색상 arbitrary 유틸리티를 거부한다. raw hex·rgb·rgba·hsl·hsla 리터럴도 허용하지 않는다.
- 문자열 `+`, template substitution, 매개변수, 구조 분해처럼 실행 중 조합되는 class는 평가하지 않는다. 이런 동적 class 조합은 Tailwind도 CSS를 생성하지 않으므로 검사 계약 밖이며, class는 항상 완성된 literal token으로 작성한다.
- 유일한 raw hex 예외는 `components/map/mapVisuals.ts`의 `MAP_DOMAIN_COLORS`에 정확한 key와 값으로 선언된 `origin.fill`, `origin.stroke`, `candidate.fill`, `candidate.stroke` 네 literal 위치다. checker는 파일·객체 위치·key·값을 확인하고, `tests/unit/map/mapVisuals.test.ts`는 origin/candidate marker data URL을 decode해 실제 SVG의 fill·stroke·형태가 이 계약과 일치하는지 검증한다.
- 경로선의 `ROUTE_VISUALS`는 raw 색상이 아니라 `--text-muted`, `--success`, `--origin` CSS 변수 이름을 사용한다.
- 서버 생성 icon과 manifest는 `lib/semanticColors.ts`를 통해 `app/globals.css`의 20개 토큰을 읽는다. 소셜 이미지는 검증된 1200×630 정적 `opengraph-image.png`와 `twitter-image.png`이며 각각 한글 `.alt.txt`를 사용한다. `/story`처럼 `openGraph`·`twitter` 객체를 덮어쓰는 페이지는 두 정적 이미지 descriptor를 각각 명시한다.

검증 명령은 다음과 같다.

```bash
npm run lint:colors
npm run test:colors
npm run test:visual
```

`npm run test:visual`은 390px·1440px의 6개 상태, 총 12개 기준 이미지를 갱신하지 않고 비교한다. 승인된 시각 변경일 때만 별도로 `--update-snapshots`를 사용한다.

## 11. 변경 체크리스트

새 토큰이나 공통 컴포넌트를 추가할 때 다음을 확인한다.

- 기존 의미 토큰으로 해결할 수 없는가?
- 출발지, 후보지, 황금 밸런스 의미를 침범하지 않는가?
- 390px과 1440px에서 검토했는가?
- 키보드와 화면 읽기 도구로 사용할 수 있는가?
- Design Lab 사례를 추가했는가?
- 단위 또는 시각 회귀 테스트를 추가했는가?
- 이 문서를 현재 구현과 일치하도록 갱신했는가?
