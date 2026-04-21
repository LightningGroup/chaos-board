# Sprint 2 — Vote / Comment 분리

- Status: Done — 2026-04-21
- Template: `PLANS.md` (루트)
- Related tickets: CB-201 / CB-202 / CB-203 / CB-204
- Follow-up tickets: CB-209 (aria-live), CB-210 (composerSide 초기 편향), CB-211 (0/0 유도 카피), CB-212 (flag OFF dead wiring), CB-213 (commentCount가 queued 포함)

---

## 1. Request
- 최종 결과: 상단 찬/반 카드가 "원탭 투표"로 동작하고, 댓글과는 독립된 투표 상태를 가지게 한다. 비율 게이지는 투표 기반이 된다.
- 범위(In): CB-201(모델 분리), CB-202(원탭 투표 UI), CB-203(컴포저 입장 칩 단순화), CB-204(모바일 컴포저 1줄화).
- 범위(Out): 서버 영속화, `useLocalStorage`, 익명 ID/쿨다운, 테스트 러너 도입, 디자인 토큰 재편, 시뮬레이션 플래그 체계 변경.

---

## 2. Context
- 진입점: `src/app/page.tsx`, `src/app/office-hours/page.tsx` — 둘 다 `OfficeHoursBoard` 재사용.
- 현재 비율: `bluePercent = getMessagePercent(liveBlueMessages.length, liveMessages.length)` — 댓글이 곧 투표.
- 현재 `selectedSide`: UI 필터 + 작성 기본값 이중 역할.
- 테스트 러너 없음. 검증은 `lint` / `tsc` / `build` / 수동 QA.
- 필수 규칙(AGENTS.md): no-else, const-first, magic value 상수화, 최소변경, 리팩터와 동작 변경 분리.
- Sprint 1에서 도입된 상수: `SIMULATED_TRAFFIC_ENABLED` (플래그 OFF가 prod default).

---

## 3. Problem
- "댓글 작성 = 투표"라 침묵 다수가 집계에서 빠진다.
- 상단 카드 버튼의 역할(필터 vs 투표)이 모호해 mental model mismatch.
- `selectedSide` 이중 역할로 필터 의도와 작성 기본값이 충돌 가능.

---

## 4. Solution

### 설계 결정 (planner 권고 채택)
| 항목 | 결정 |
|---|---|
| 백필 | **B** — 초기 투표 0/0. 가짜 투표 주입 금지. |
| 자동 투표 연동 | **없음**. 투표 없이 댓글 가능, 내 투표와 다른 편 댓글도 허용. |
| `selectedSide` | **폐기**. `composerSide`로 이름 변경 후 분리. |
| 단건 제한 | `myVote: Vote \| null` + 별도 `voteCounts`. |
| undo UX | 같은 쪽 재탭 = 취소 (토글). |
| 컴포저 빈 투표 상태 | 칩 2개 축소 유지. myVote 있으면 `composerSide` 자동 동기화. |
| 카운트 라벨 | "N표" / "댓글 M개" 분리 표기. 게이지 aria-label "투표 기준 찬반 비율". |

### 변경 대상
- `src/components/office-hours-board.model.ts` — `Vote` 타입, `createVote`, `applyVote`, `createInitialVoteCounts`, 상수.
- `src/components/office-hours-board.tsx` — 상태 2개 추가(`myVote`, `voteCounts`), `selectedSide`→`composerSide` 리네이밍, 카드 핸들러 교체, 라벨/aria 교체, 컴포저 1줄화.

### 유지할 것
- `ChatMessage` 모델과 관련 함수 전부
- 피드, `MessageCard`, `bestMessage` 계산
- `queuedMessages` 시뮬레이션 경로
- `sideMeta`, `getMessageCardClass`, `getLikeButtonClass`, `getOverviewButtonClass`

### 단계별 실행 순서 (리팩터 → 동작 순)
1. model에 `Vote`/순수 함수/상수 추가. 기존 export 건드리지 않음. (no behavior change)
2. tsx에서 `selectedSide` → `composerSide` 전수 리네이밍. (no behavior change)
3. `myVote`, `voteCounts` 상태 도입. `handleVote(side)` 추가. 상단 카드 `onSelect` → `onVote`로 교체.
4. `bluePercent`/`redPercent` 계산 소스: `liveMessages` → `voteCounts`. 상단 서브라인 "참여 N표 · 댓글 M개" + 게이지 aria-label "투표 기준" 교체.
5. 컴포저: myVote 변화 시 `composerSide` 동기화 (handleVote에서 같이 setter). 안내 문구 placeholder로 흡수. 칩 축소.
6. CB-204 모바일 레이아웃: input+전송 1줄 + 작은 칩 줄을 위에 둠.

### 순수 함수 계약
- `type Vote = { side: Side }`
- `createVote(side: Side): Vote` — 입력만 의존.
- `applyVote(current: Vote | null, nextSide: Side): Vote | null` — 같은 side면 `null`, 아니면 `createVote(nextSide)`. 입력 객체 비변이.
- `createInitialVoteCounts(): { blue: 0; red: 0; total: 0 }`
- `applyVoteCounts(counts, prev: Vote | null, next: Vote | null): VoteCounts` — 단일 경로 전이. 함수형 setter로 호출. **clamp 포함(음수 방지)**.
- `getVoteRatio(counts): { bluePercent, redPercent }` — **rounding invariant: `red = 100 - blue`로 합 100 보장**.

### 버릴 대안
- **A(초기 댓글 6개 백필)**: 가짜 투표로 신뢰 저하.
- **C(완전 독립)**: B와 UX 거의 동일하되 설명 복잡.
- 단일 소스 `votes: Vote[]`: 클라 로컬에서 배열은 과설계.

### 트레이드오프
- `myVote` + `voteCounts` 2개 상태 → 불일치 위험. `applyVote`+`applyVoteCounts` 단일 경로 강제 + `Math.max` clamp로 완화.
- 초기 UX가 0/0으로 비어 보임. 첫 투표 유도 카피가 필요하지만 이번 범위는 아님(CB-211).

---

## 5. Architecture Check
- UI(컴포넌트) / 도메인(model 순수 함수) / 이펙트(시뮬 플래그) 경계 유지.
- 투표 경로에 새 이펙트 없음. 타이머/네트워크 없음.
- 새 추상화는 `Vote`/`VoteCounts` 두 타입만. 과도한 추상화 없음.
- 기존 `sideMeta`, `MessageCard`, `DebateOverviewCard` 구조 패턴 유지.

---

## 6. State Transitions

| 현재 myVote | 이벤트 | 다음 myVote | voteCounts |
|---|---|---|---|
| null | vote(blue) | {blue} | blue +1 |
| null | vote(red) | {red} | red +1 |
| {blue} | vote(blue) | null | blue −1 |
| {blue} | vote(red) | {red} | blue −1, red +1 |
| {red} | vote(red) | null | red −1 |
| {red} | vote(blue) | {blue} | red −1, blue +1 |
| any | 댓글 작성/좋아요/시뮬 유입 | 변화 없음 | 변화 없음 |

불변: `voteCounts.blue ≥ 0`, `voteCounts.red ≥ 0`, `myVote === null ∨ voteCounts[myVote.side] ≥ 1`.

---

## 7. Validation
- `npm run lint`, `npx tsc --noEmit`, `npm run build` 통과 — **완료**.
- 수동 QA 시나리오:
  1. 첫 진입 0/0, 게이지 비어 있음.
  2. 찬성 탭 → blue 100%, "1표".
  3. 반대 탭 → blue 0%, red 100%, "1표".
  4. 같은 쪽 재탭 → 0/0, "0표", myVote null. **composerSide는 유지**(하드닝 H3).
  5. 투표 없이 댓글 작성 → 투표 수치 불변, 댓글만 증가.
  6. 찬성 투표 후 반대 댓글 작성 → 허용, 투표 blue 100% 유지.
  7. 플래그 ON: 시뮬 댓글 유입 → 투표 수치 불변.
  8. 모바일(≤640px): input+전송 1줄, 칩 축소 줄 위에 존재.
- 실패 케이스 확인:
  - 빠른 연속 탭 race → 함수형 setter로 방지 + `Math.max` clamp로 correctness 보장.
  - `selectedSide` 참조 잔존 → grep 전수 확인 (0건 검증됨).
  - `getOppositeSide(composerSide)` 답글 시뮬 방향 정상 여부.
  - `aria-pressed` 투표 상태와 일치.

---

## 8. Review (사후 기록)
- 범위 확장 방지: localStorage/익명ID/쿨다운/테스트러너 금지 — 준수.
- 회귀 위험: aria-label 의미 변경(댓글 기준 → 투표 기준) 누락 시 a11y 회귀. 전수 grep 필수 — 검증됨.
- 사람 인수: PLANS(본 문서)와 State Transitions 표로 의도 명시.
- reviewer 판정: **approve** (경미 관찰 1건 이월: CB-213).

---

## 9. Risks (사후 기록)
- **차단급**: `selectedSide` 제거 시 `handleSubmit` 내부 `getOppositeSide(selectedSide)` 잔존 가능 — 해소됨.
- **고위험**: 함수형 setter 누락 시 race — `applyVote`/`applyVoteCounts` 단일 경로 + clamp로 해소.
- **중간**: 초기 0/0 UX — CB-211로 이월. `composerSide` blue 편향 — CB-210으로 이월.

---

## 10. Hardening (사후 기록, devils-advocate 반영)
- **H1**: `applyVoteCounts`에 `Math.max(INITIAL_VOTE_COUNT, …)` clamp 추가.
- **H2**: `getVoteRatio` rounding invariant — `redPercent = TOTAL_PERCENT - bluePercent`.
- **H3**: `handleVote` 취소 시 `composerSide` 유지 (렌더 시점 `myVote` 기반 `isUndo` 판단 + early return).
- **H4**: sub-line 문구 간결화 — aria-label과 중복 제거.

---

## 11. Final Report (완료 시점 기록)
- 변경: `src/components/office-hours-board.model.ts`(+83/−0), `src/components/office-hours-board.tsx`(+87/−71).
- 검증: lint / tsc / build / grep 금지 패턴 모두 통과. reviewer approve, tester pass.
- 미검증(수동 QA): 위 §7 시나리오 실기기 실행, motion-width transition 플래시 여부, 스크린리더 실발화.
- 남은 리스크: 이월 티켓 CB-209~CB-213.
- 다음 스프린트 의존: Sprint 3(영속성, `useLocalStorage`)은 본 Sprint 2의 `Vote`/`VoteCounts`/`ChatMessage` 직렬화에 의존.
