# 모두스팟

여러 사람의 출발지와 약속 장소 후보를 한 번에 비교하는 대중교통 약속 장소 탐색 서비스입니다. 카카오로 장소를 검색하고 ODsay로 이동 시간을 조회해, 후보별 순위·경로 비교표·지도를 함께 보여줍니다.

## 주요 기능

- 여러 출발지 × 여러 목적지 후보의 대중교통 이동 시간 비교
- 날짜와 출발 시각 설정 및 출발 시간 반영 켜기/끄기
- 평균 이동 시간과 최장 이동 시간을 함께 고려하는 **황금 밸런스** 후보 추천
- 계산 진행률과 도착한 결과의 점진적 표시, 일부 실패 시 성공 결과 유지
- 후보 및 경로 선택과 지도 연동, 버스·지하철·도보 구간 상세 확인
- 출발지·후보지·출발 시각을 공유 링크로 복원하고 경로 다시 계산
- 데스크톱 비교 패널과 지도, 모바일 지도와 바텀시트 구성
- 이름·답장 이메일을 선택적으로 입력하는 문의 폼

## 빠른 시작

Node.js 22 LTS와 npm 사용을 권장합니다. Next.js 16의 최소 Node.js 요구 사항은 20.9이며, 테스트 도구를 포함한 설치 환경에서는 의존성의 `engines` 조건도 충족해야 합니다.

```bash
npm ci
```

프로젝트 루트의 `.env.example`을 `.env.local`로 복사합니다.

```powershell
# Windows PowerShell
Copy-Item .env.example .env.local
```

```bash
# macOS / Linux
cp .env.example .env.local
```

`.env.local`에 카카오 JavaScript 키, 카카오 REST 키, ODsay 키를 입력하고 개발 서버를 실행합니다. 문의 기능을 사용할 때는 SMTP 설정도 필요합니다.

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 출발지와 목적지 후보를 각각 한 개 이상 추가한 뒤 비교를 실행합니다.

프로덕션 실행:

```bash
npm run build
npm run start
```

## 환경 변수

기본 설정 예시는 [`.env.example`](.env.example)을 기준으로 합니다. 실제 키와 비밀번호는 `.env.local` 또는 배포 환경의 환경 변수에만 저장합니다.

| 변수 | 용도 / 기본값 |
| --- | --- |
| `NEXT_PUBLIC_KAKAO_JS_API_KEY` | 브라우저 카카오 지도 SDK용 JavaScript 키 |
| `KAKAO_REST_API_KEY` | 서버의 카카오 장소 검색용 REST API 키 |
| `ODSAY_API_KEY` | 서버의 대중교통 경로 및 그래픽 좌표 조회용 키 |
| `NEXT_PUBLIC_APP_URL` | ODsay 요청의 `Referer`·`Origin`과 사이트 메타데이터 기준 URL. 로컬 설정은 `http://localhost:3000` |
| `TRANSIT_SERVER_MAX_CONCURRENCY` | 서버 인스턴스 내 경로 조회 최대 동시 실행 수. 기본 `3` |
| `TRANSIT_SERVER_MIN_START_GAP_MS` | 서버 경로 조회의 최소 시작 간격. 기본 `500`ms |
| `TRANSIT_SERVER_MAX_STARTS_PER_WINDOW` | 시간 창 내 최대 요청 시작 수. 기본 `2`, `0`이면 시간 창 제한 해제 |
| `TRANSIT_SERVER_RATE_WINDOW_MS` | 요청 시작 수를 집계하는 시간 창. 기본 `1000`ms |
| `CONTACT_SMTP_HOST` | 문의 메일 SMTP 호스트. 예시 `smtp.gmail.com` |
| `CONTACT_SMTP_PORT` | SMTP 포트. 예시 파일은 `465`, 미설정 시 코드는 `587` 사용 |
| `CONTACT_SMTP_SECURE` | TLS 연결 여부. 문자열 `true`일 때 활성화 |
| `CONTACT_SMTP_USER` | SMTP 인증 계정 |
| `CONTACT_SMTP_PASS` | SMTP 인증 비밀번호 |
| `CONTACT_FROM_EMAIL` | 선택값. 비워두면 `CONTACT_SMTP_USER`를 발신 주소로 사용 |

카카오 지도에는 REST 키와 별개의 JavaScript 키가 필요하며, 카카오 개발자 콘솔에 로컬·배포 도메인을 등록해야 합니다. `NEXT_PUBLIC_` 변수는 브라우저에 공개되므로 서버용 키나 SMTP 비밀번호를 넣지 않습니다. 배포 시 앱 URL과 외부 API의 허용 도메인 설정을 맞추고, 환경 변수 변경 후 서버를 재시작합니다. 공개 환경 변수 변경은 빌드에도 반영해야 합니다.

문의 메일 수신 주소는 `app/api/contact/route.ts`에 고정되어 있습니다. Gmail SMTP를 사용할 경우 `CONTACT_SMTP_PASS`에 앱 비밀번호 등 SMTP 인증 정보를 설정합니다.

## 추천 기준과 결과 해석

후보별로 모든 출발지의 유효한 경로가 확보되면 다음 점수를 계산하고, 낮은 점수부터 정렬합니다.

```text
후보 점수 = 최장 이동 시간 + 평균 이동 시간
```

출발지와 후보지가 각각 두 개 이상일 때 최저 점수 후보를 황금 밸런스로 표시합니다. 동점은 후보 입력 순서를 따릅니다. 경로가 실패했거나 계산이 아직 끝나지 않은 후보는 점수를 부여하지 않고 순위 뒤쪽에 표시합니다.

각 출발지·후보지 조합은 ODsay가 반환한 첫 번째 경로를 사용합니다. 근거리 오류 코드 `-98`은 `walkOnly: true`, 시간·요금 `0`의 도보 전용 결과로 변환합니다. 이 값은 실제 도보 시간을 측정한 결과가 아닙니다.

공유 URL에는 장소 이름·좌표와 출발 시각 설정을 담습니다. `s`, `e`는 장소 목록, `dt`는 출발 시간 반영 여부, `d`는 `YYYYMMDD`, `t`는 `HHMM`입니다. 저장된 결과를 전달하는 방식이 아니라, 링크를 열 때 설정을 복원하고 경로를 다시 조회하므로 조회 시점에 따라 결과가 달라질 수 있습니다.

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| 프레임워크 | Next.js 16.2.4 App Router, React 19.2.4, TypeScript |
| 상태 관리 | Zustand 5 |
| UI | Tailwind CSS 4, Pretendard Variable, 의미 기반 색상 토큰 |
| 지도·검색 | react-kakao-maps-sdk, 카카오 로컬 검색 API |
| 경로 조회 | ODsay 대중교통 API |
| 문의 메일 | Nodemailer, Node.js 런타임 |
| 검증 | Vitest 3, Testing Library, Playwright, ESLint 9 |

## 프로젝트 구조

```text
app/
  api/                     # search, transit, transit/graphic, contact
  home/                    # 비교 작업공간, 입력·결과 패널, 공유 URL 복원
  design-lab/              # 개발 전용 UI 상태 확인
  contact/                 # 문의 페이지와 폼
  layout.tsx               # 공통 레이아웃과 메타데이터
  page.tsx                 # 홈 엔트리
components/
  location/                # 장소 검색, 출발지·후보지 목록
  result/                  # 후보 순위, 비교 행렬, 경로 상세, 진행률
  map/                     # 지도와 경로·마커 표현
  ui/                      # 버튼, 바텀시트, 알림 등 공통 UI
  layout/                  # 헤더, 푸터, 작업공간 셸
  design-lab/               # 고정 UI 예시 데이터
  search/                  # 시간 필터와 공유 버튼
hooks/                     # 장소 검색, 경로 행렬 계산
lib/                       # 외부 API, 오류 정규화, 서버 요청 제한, 색상 토큰
store/                     # Zustand 장소·출발 시각 상태
utils/                     # 추천 점수, 공유 URL, 날짜·시간 유틸리티
types/                     # 카카오·ODsay 데이터 타입
scripts/                   # 색상 검사와 경로 요청 실험
tests/
  unit/                    # API, 훅, 상태·결과·지도·UI 단위 테스트
  e2e/                     # 사용자 흐름, 반응형 UI, 시각 회귀 테스트
docs/                      # 디자인 시스템, 요청 실험 계획 및 결과
```

### 데이터 흐름

```text
장소 검색 → useLocationSearch → /api/search → 카카오 로컬 검색
비교 실행 → useTransitMatrix → /api/transit → 서버 요청 제한 → ODsay
결과 표시 → 후보 순위·비교 행렬 → 경로 선택 → /api/transit/graphic → 지도
공유 링크 → RouteSync → Zustand 설정 복원 → 경로 재계산
```

`HomePageClient`가 계산 상태를 관리하고 `ComparisonWorkspace`가 입력·결과·지도를 조합합니다. `useSelectedRouteMapState`는 자동 경로 선택과 지도 상태를 관리합니다. 장소와 출발 시각은 `store/useAppStore.ts`, 계산 결과와 진행률은 `useTransitMatrix`에 있습니다.

### 요청 스케줄링

클라이언트는 계산당 최대 3개 요청을 동시에 실행하며, 요청 시작 사이에 최소 500ms 간격을 둡니다. 새 계산·초기화·언마운트 시 기존 요청을 취소하고 이전 응답이 현재 결과를 덮어쓰지 않도록 합니다. HTTP `429` 또는 ODsay `-1` 응답이 감지되면 아직 시작하지 않은 요청을 중단합니다.

서버의 `/api/transit`는 별도 공유 큐를 통해 동시 실행·시작 간격·시간 창 제한을 적용합니다. 이 큐는 **서버 인스턴스 단위**로 동작하므로 여러 인스턴스의 요청량을 합산해 제한하지 않습니다. 서버 환경 변수는 클라이언트의 고정 스케줄링 값을 변경하지 않습니다.

## API 라우트

| 메서드 / 경로 | 입력 | 역할 |
| --- | --- | --- |
| `GET /api/search` | `q`: 검색어 | 카카오 장소 검색 프록시 |
| `GET /api/transit` | `sx`, `sy`: 출발 경도·위도 / `ex`, `ey`: 도착 경도·위도 / 선택 `date`, `time` | ODsay 첫 번째 경로를 앱 응답으로 변환 |
| `GET /api/transit/graphic` | `mapObj`: 경로 응답의 그래픽 조회 값 | 선택 경로의 노선 좌표 조회 |
| `POST /api/contact` | JSON `message`, 선택 `senderName`, `senderEmail` | SMTP 문의 메일 발송 |

경로 응답에는 `totalTime`, `payment`, `transitCount`, `pathType`, `subPath`, `mapObj` 등이 포함됩니다. 경로 오류는 `error`, `errorCode`, `errorStatus`, `errorSource` 등으로 정규화합니다.

문의 내용은 공백 제거 후 10~2,000자, 이름·이메일은 각각 최대 120자입니다. 잘못된 입력은 `400`, SMTP 설정 누락은 `503`, 메일 전송 실패는 `502`, 성공은 `{ "ok": true }`를 반환합니다.

## 개발과 검증

| 명령 | 용도 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드된 앱 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run lint:colors` | 의미 기반 색상 사용 규칙 검사 |
| `npm run test:unit` | 전체 단위 테스트 |
| `npm run test:colors` | 색상 검사 스크립트 테스트 |
| `npm run test:e2e` | 전체 Playwright 테스트, 시각 회귀 포함 |
| `npm run test:visual` | 디자인 랩 시각 회귀 테스트 |
| `npm run experiment:transit` | 실제 경로 API의 요청 간격 실험 |
| `npm run experiment:transit-scheduler` | 실제 경로 API의 스케줄러 실험 |

Playwright를 처음 실행할 때 Chromium을 설치합니다.

```bash
npx playwright install chromium
npm run test:unit
npm run lint
npm run lint:colors
npm run test:e2e
npm run build
```

Playwright는 `http://localhost:3100`에 개발 서버를 자동 실행하며, 해당 포트의 기존 서버가 있으면 재사용합니다. 회귀 테스트는 API 응답을 모킹하고 디자인 랩 테스트는 고정 데이터를 사용합니다. 실제 외부 API의 인증·쿼터·응답까지 검증하는 테스트는 아닙니다.

시각 회귀 기준 이미지는 저장소의 `chromium-win32` 스냅샷을 사용합니다. 운영체제나 렌더링 환경이 다르면 기준 이미지와 차이가 발생할 수 있으므로 의도한 UI 변경인지 확인한 뒤 갱신합니다.

개발 서버의 `/design-lab`에서 입력·계산 중·성공·부분 실패·전체 실패 등 고정 상태를 확인할 수 있습니다. 이 페이지는 개발 환경에서만 제공되며 프로덕션에서는 404를 반환합니다.

요청 실험 스크립트는 기본적으로 `http://localhost:3000`의 API를 호출합니다. 개발 서버와 유효한 외부 API 키가 필요하며 실행 시 실제 API 쿼터를 사용합니다. 실험 조건과 결과 해석은 아래 문서를 참고합니다.

## 문제 해결

| 증상 | 확인할 사항 |
| --- | --- |
| 지도가 표시되지 않음 | JavaScript 키 종류, 카카오 허용 도메인, SDK 로드 여부, 환경 변수 변경 후 재시작·재빌드 |
| 장소 검색 실패 | `KAKAO_REST_API_KEY`, `/api/search` 응답과 서버 로그 |
| 경로 계산 실패 또는 중단 | `ODSAY_API_KEY`, 앱 URL·허용 도메인, `/api/transit` 오류 코드, 요청 제한 및 쿼터 |
| 일부 경로만 실패 | 성공 결과는 유지됨. 실패 셀을 확인하고 잠시 후 다시 비교 |
| 공유 링크 복원 실패 | `s`, `e`, `dt`, `d`, `t` 보존 여부와 URL 인코딩 손상 여부 |
| 문의 발송 실패 | SMTP 환경 변수와 인증 정보, API의 `503`·`502` 응답, 서버 로그 |
| E2E 서버 실행 실패 | Chromium 설치 여부, 3100 포트 점유 및 기존 서버 상태 |

## 관련 문서

- [디자인 시스템](docs/design-system.md): 색상 토큰, 타이포그래피, 반응형 화면과 UI 규칙
- [경로 요청 실험 계획](docs/transit-request-interval-experiment-plan.md): 동시성·시작 간격·시간 창 제한 비교
- [경로 요청 실험 결과](docs/results/README.md): 저장된 JSON·CSV와 실험 범위

코드를 수정하는 에이전트는 [AGENTS.md](AGENTS.md)를 읽고, 설치된 Next.js의 `node_modules/next/dist/docs/`에서 관련 가이드를 확인해야 합니다.
