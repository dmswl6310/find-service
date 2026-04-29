# 모두스팟

## 프로젝트 개요

`모두스팟`은 여러 출발지와 여러 목적지 후보를 한 번에 비교해서, 대중교통 기준으로 가장 적절한 약속 장소를 찾는 Next.js 애플리케이션입니다.

카카오 로컬 검색 API로 장소를 찾고, ODSAY 대중교통 API로 각 출발지/목적지 조합의 이동 시간을 계산합니다. 계산 결과는 표와 지도에서 함께 확인할 수 있습니다.

## 기능 개요

- 여러 출발지 추가
- 여러 목적지 후보 추가
- 출발 시간 반영 켜기/끄기
- NxM 대중교통 소요 시간 비교
- 자동 추천 경로 선택 및 지도 반영
- 선택 경로 상세 보기
- 공유 URL 생성 및 복원

## 기술 스택

- `Next.js 16` App Router
- `React 19`
- `TypeScript`
- `Zustand`
- `react-kakao-maps-sdk`
- `Vitest` + `Testing Library`
- `Playwright`
- `ESLint`

## 프로젝트 구조

```text
app/
  api/
    search/route.ts
    transit/route.ts
    transit/graphic/route.ts
  home/
    MainContent.tsx
    RouteSync.tsx
    mapRouteHelpers.ts
    useSelectedRouteMapState.ts
  layout.tsx
  page.tsx
components/
  map/
  result/
  search/
hooks/
  useLocationSearch.ts
  useTransitMatrix.ts
lib/
  external-config.ts
  kakao.ts
  odsay.ts
  odsay-error.ts
  transitFetchAdapter.ts
store/
  useAppStore.ts
types/
utils/
tests/
  unit/
  e2e/
```

## 환경 변수

로컬 개발은 `.env.local`을 사용합니다.

```env
NEXT_PUBLIC_KAKAO_JS_API_KEY=
KAKAO_REST_API_KEY=
ODSAY_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
CONTACT_SMTP_HOST=
CONTACT_SMTP_PORT=465
CONTACT_SMTP_SECURE=true
CONTACT_SMTP_USER=
CONTACT_SMTP_PASS=
CONTACT_FROM_EMAIL=
```

설명:

- `NEXT_PUBLIC_KAKAO_JS_API_KEY`: 브라우저에서 카카오 지도 SDK를 로드할 때 사용하는 JavaScript 키
- `KAKAO_REST_API_KEY`: 서버에서 카카오 장소 검색 API를 호출할 때 사용하는 REST API 키
- `ODSAY_API_KEY`: 서버에서 ODSAY 대중교통 API를 호출할 때 사용하는 키
- `NEXT_PUBLIC_APP_URL`: ODSAY 요청 헤더의 `Referer`/`Origin` 및 앱 기준 URL fallback에 사용
- `CONTACT_SMTP_HOST`, `CONTACT_SMTP_PORT`, `CONTACT_SMTP_SECURE`, `CONTACT_SMTP_USER`, `CONTACT_SMTP_PASS`: 문의 폼 메일 전송에 사용하는 SMTP 설정. Gmail 기준 `CONTACT_SMTP_HOST=smtp.gmail.com`, `CONTACT_SMTP_PORT=465`, `CONTACT_SMTP_SECURE=true`를 사용합니다.
- `CONTACT_FROM_EMAIL`: 선택값입니다. 비워두면 `CONTACT_SMTP_USER`를 발신자 주소로 사용합니다.

주의:

- 카카오 지도는 JavaScript 키가 필요합니다. REST 키만으로는 지도 SDK가 동작하지 않습니다.
- 카카오 개발자 콘솔에 현재 도메인(`localhost:3000`, 배포 도메인)을 등록해야 합니다.
- 문의 폼은 SMTP 환경 변수가 설정되어야 `dmswl6310@gmail.com`으로 메일을 전송합니다. Gmail을 사용할 경우 일반 비밀번호가 아닌 앱 비밀번호 또는 SMTP 전용 인증 정보를 `CONTACT_SMTP_PASS`에 넣으세요.

## 실행 방법

의존성 설치:

```bash
npm install
```

개발 서버 실행:

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

## 스크립트

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test:unit
npm run test:e2e
```

## 아키텍처와 데이터 흐름

현재 구조는 아래 흐름으로 정리됩니다.

```text
UI(app/components)
  -> hooks
  -> app/api
  -> lib(external APIs)
```

주요 흐름:

1. 사용자가 `LocationInput`에서 장소를 검색합니다.
2. `useLocationSearch`가 `/api/search?q=...`를 호출합니다.
3. `app/api/search/route.ts`가 `lib/kakao.ts`를 통해 카카오 검색 API를 호출합니다.
4. 사용자가 출발지/목적지를 선택하고 `소요시간 비교하기 🚀`를 누릅니다.
5. `useTransitMatrix`가 각 조합에 대해 `/api/transit`를 순차 간격(250ms)으로 호출합니다.
6. `app/api/transit/route.ts`가 `lib/odsay.ts`를 통해 대중교통 경로를 조회합니다.
7. 결과 표(`ResultTable`)와 지도(`MiniMap`)가 같은 상태를 공유하며 갱신됩니다.
8. 선택된 경로는 `/api/transit/graphic`를 통해 그래픽 좌표를 받아 더 상세한 지도 경로를 표시합니다.

### 상태 관리

`store/useAppStore.ts`가 아래 전역 상태를 관리합니다.

- `starts`
- `ends`
- `useDepartureTime`
- `targetDate`
- `targetTime`

### 페이지 구성

- `app/page.tsx`: 최소 엔트리 포인트
- `app/home/RouteSync.tsx`: 공유 URL(`s`, `e`) 복원 및 자동 계산 트리거
- `app/home/MainContent.tsx`: 실제 화면 조합
- `app/home/useSelectedRouteMapState.ts`: 자동 추천 경로 선택, 지도 경로 상태 관리
- `app/home/mapRouteHelpers.ts`: 지도용 경로/세그먼트 계산

## API 라우트

### `GET /api/search`

Query:

- `q`: 검색어

역할:

- 카카오 장소 검색 API 프록시

### `GET /api/transit`

Query:

- `sx`, `sy`: 출발지 좌표
- `ex`, `ey`: 목적지 좌표
- `date`, `time`: 선택적 출발 시각

역할:

- ODSAY 대중교통 경로 조회
- `-98` 응답은 도보 전용 성공 결과로 변환
- 에러 상태와 payload를 앱 내부 형식으로 정규화

### `GET /api/transit/graphic`

Query:

- `mapObj`: ODSAY 그래픽 경로 조회용 값

역할:

- 선택 경로의 그래픽 좌표 조회
- 지도에 더 자세한 경로선 표시

## 검증

기본 검증 순서:

```bash
npm run test:unit
npm run test:e2e
npm run lint
npm run build
```

현재 자동 검증은 다음을 포함합니다.

- search/transit/graphic API 계약 테스트
- stale search response 방지 테스트
- partial transit failure 유지 테스트
- 공유 URL 복원 E2E
- 검색 -> 선택 -> 계산 -> 결과 표시 E2E

## 문제 해결

### 지도가 안 뜨는 경우

- `NEXT_PUBLIC_KAKAO_JS_API_KEY`가 실제 JavaScript 키인지 확인
- 카카오 콘솔에 현재 도메인이 등록되어 있는지 확인
- 개발 서버 재시작 후 다시 확인

### 검색은 되는데 경로 계산이 실패하는 경우

- `ODSAY_API_KEY` 설정 확인
- `/api/transit` 응답 상태 및 콘솔 로그 확인
- 일부 조합 실패는 표에 실패 셀과 함께 유지되도록 설계되어 있음

### 공유 URL이 복원되지 않는 경우

- `s`, `e` 쿼리 파라미터가 유지되는지 확인
- base64 인코딩된 payload가 손상되지 않았는지 확인

### lint 경고가 남는 경우

- 현재 기준으로 `components/result/ResultTable.tsx`에 미사용 지역 변수 경고 1개가 남아 있을 수 있습니다.
- 치명적 에러는 아니지만 최종 정리 단계에서 제거하는 것이 좋습니다.
