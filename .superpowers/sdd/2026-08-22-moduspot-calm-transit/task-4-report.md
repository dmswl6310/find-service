# 작업 4 보고서

## RED

`npm run test:unit -- tests/unit/ui/feedback.test.tsx` 실행 결과, `@/components/ui/Progress` 모듈을 찾지 못해 테스트 수집이 실패했다(exit 1). 구현 부재에 의한 기대된 실패를 확인했다.

## GREEN

Progress, InlineNotice, BottomSheet와 확장 단위 테스트를 추가한 뒤 같은 focused 명령을 실행했다.

- 테스트 파일 1개 통과
- 테스트 5개 통과
- 진행률 음수/초과 clamp 및 `max=0` 안전성 확인
- info/warning의 `status`, danger의 `alert` 확인
- 각 tone의 가시적 제목과 semantic 왼쪽 테두리 확인
- named region, aria-hidden grabber, className 조합 확인

## 검증

- `npm run test:unit -- tests/unit/ui/feedback.test.tsx`: 통과 (1 file, 5 tests)
- `npm run test:unit`: 통과 (13 files, 61 tests)
- `npm run lint`: 통과 (exit 0)
- `git diff --check`: 문제 없음

## 변경 파일

- `components/ui/Progress.tsx`
- `components/ui/InlineNotice.tsx`
- `components/ui/BottomSheet.tsx`
- `tests/unit/ui/feedback.test.tsx`

## Self-review

- 모든 색상은 `bg-action`, `bg-border`, `text-info`, `text-warning`, `text-danger`, `border-l-*` 의미 토큰만 사용했다.
- brief의 raw rgba arbitrary shadow를 사용하지 않고 `shadow-xl`로 구현했다.
- 네이티브/구조 접근성 계약(role, aria 값, named region, aria-hidden grabber)을 보존했다.
- Progress의 계산은 0~100으로 clamp하며 max 0에서 0으로 안전하게 처리한다.

## 커밋

- `f5c8a64` — `feat: 피드백과 바텀시트 기본 컴포넌트 추가`
