# 지원 브라우저 정책

이 문서는 Chaos Board 웹 앱이 어느 브라우저 환경까지 동작을 약속하고, 어느 수준까지 시각 품질을 보장하는지를 정의한다. 내부 팀이 구현/검토 기준으로 쓰는 "내부 기준"과, 사용자/외부에 노출되는 "외부 약속"을 분리한다.

---

## 1. 내부 기준 (Internal)

개발, 리뷰, QA가 참조하는 기준. 구체적인 수치 고정보다 원칙과 동작 보장 수준을 명시하는 것이 목적이다.

### 1.1 지원 엔진

- Blink (Chrome, Edge, Android Chrome 등 Chromium 파생) — 1차 지원.
- WebKit (Safari, iOS Safari) — 1차 지원.
- Gecko (Firefox 데스크탑) — 동작 보장만 한다. 시각 품질은 best-effort.
- 그 외 엔진(Trident/EdgeHTML, Presto 등 레거시) — 비지원.

### 1.2 지원 브라우저 범위

아래는 "최근 버전"을 기준으로 한다. 숫자 버전을 고정하지 않는 이유는 실제 사용자 세그먼트 데이터가 아직 없기 때문이다. 숫자 고정 조건은 §5 재논의 트리거를 참조한다.

- Chrome (데스크탑) — 최근 버전.
- Edge (데스크탑) — 최근 버전.
- Safari (macOS) — 최근 버전.
- iOS Safari — 최근 버전 (최소 버전 숫자 고정하지 않음).
- Android Chrome — 최근 버전.
- Firefox (데스크탑) — 최근 버전. 동작 보장만.

### 1.3 동작 보장 수준 (3단)

각 기능은 아래 3단 중 하나로 분류한다. 애매하면 낮은 단으로 내린다.

1. **차단 금지 (Must Work)**
   핵심 플로우가 멈추면 안 된다. 방문, 주제(논제) 표시, 찬/반 투표, 투표 취소(같은 쪽 재탭), 댓글 등록, 댓글 목록 렌더, 좋아요 토글이 모두 여기에 해당한다. 이 범주에서 결함이 발견되면 지원 브라우저 어느 쪽에서든 즉시 차단 이슈로 간주한다.
2. **시각 best-effort**
   시각 품질(그림자 농도, 블러 강도, 전환 프레임, 서브픽셀 렌더링 편차 등)은 브라우저마다 다를 수 있다. 육안으로 식별되더라도 핵심 플로우가 동작하면 차단 이슈가 아니다. 필요 시 §4 알려진 차이 목록에 기록하고 별도 티켓으로 추적한다.
3. **완전 비지원 명시**
   레거시 엔진(Trident/EdgeHTML 등)과 JavaScript가 꺼져 있는 환경은 완전 비지원이다. 현재 앱 내에 별도 안내 UI는 두지 않는다 (§2.2 참조).

---

## 2. 외부 약속 (External)

> 이 섹션의 문구는 외부/사용자에게 노출 가능하다. 톤 변경 시 **Marketer 리뷰 대상**이다. 숫자/버전을 남용하지 말 것.

### 2.1 사용자용 한 문장

> Chaos Board는 최근 버전의 Chrome, Edge, Safari, iOS Safari, Android Chrome에서 정상 동작하도록 만들어졌습니다.

### 2.2 미지원 환경에서의 안내 톤 가이드

미지원 환경(레거시 브라우저, JavaScript 비활성화 등)에서는 앱 내 강한 경고/에러 메시지를 띄우지 않는다. 가이드는 아래를 따른다.

- 톤: 에러가 아니라 안내.
- 피해야 할 표현: "지원하지 않는 브라우저입니다", "사용할 수 없습니다" 같은 단정형.
- 권장 표현: "최근 버전의 Chrome/Safari에서 가장 안정적으로 동작합니다" 같은 완곡형.
- 적용 위치: 현재 앱 내 별도 안내 UI는 구현하지 않는다. 외부 채널(README, 공지, 링크 공유 메시지 등)에서 필요할 때 위 톤을 적용한다.

---

## 3. 지원 범위에 대한 전제

- 이 앱은 클라이언트 사이드 상태(React state + 커스텀 훅) 기반이며 서버 영속화 의존이 없다. 따라서 네트워크 불안정 시에도 핵심 플로우(투표/댓글)는 로컬에서 성립한다.
- 현재 앱은 네트워크 호출과 `localStorage` 사용이 없다. 타이머(`window.setInterval`, `window.setTimeout`)는 `src/components/office-hours-board.tsx` 내부에서 직접 호출된다. 브라우저별 타이머/스토리지 이슈는 먼저 해당 파일을 확인한다. (향후 네트워크/스토리지가 도입되면 `src/AGENTS.md` §3/§5 원칙에 따라 경계 계층으로 분리한다.)
- CSS는 Tailwind와 소수의 커스텀 키프레임(`src/app/globals.css`)만 사용한다. `prefers-reduced-motion: reduce`가 설정된 환경에서는 애니메이션이 사실상 비활성화된다.

---

## 4. 알려진 차이 (Known differences)

아래 항목은 현재 코드에서 엔진/OS별로 시각 품질 차이가 날 수 있다고 식별된 non-blocking 요소다. 수정 여부는 티켓 단위로 판단하며, 여기서는 번호만 부여해 추적 대상으로 표시한다. 번호는 `CB-` 접두어를 쓰고, 이번 정책 공표와 함께 `CB-214`부터 시작한다.

- **CB-214 — 시스템 폰트 fallback 체인 결과 상이**
  `src/app/globals.css` body font-family는 `"SUIT Variable" → "Pretendard Variable" → "Apple SD Gothic Neo" → "Noto Sans KR" → system-ui → sans-serif` 체인이며, 웹폰트를 import하지 않는다. 결과적으로 macOS(Apple SD Gothic Neo), iOS(SUIT/Pretendard 미설치 시 Apple SD Gothic Neo), Windows(대부분 system-ui로 폴백), Android(Noto Sans KR 또는 system-ui)에서 글자 무게와 자간이 눈에 띄게 달라질 수 있다. **특히 Windows Chrome/Edge에서 SUIT/Pretendard가 OS 기본으로 없어 얇아 보일 수 있다.** 웹폰트 도입 여부는 §5 재논의 트리거로 관리한다.

- **CB-215 — `motion-width` transition의 reflow 비용**
  `src/app/globals.css`의 `.motion-width`는 `width` 속성에 transition을 걸고 있으며, 이는 투표 비율 게이지(`src/components/office-hours-board.tsx`의 상단 그라디언트 바)에 적용된다. `width` 전환은 레이아웃 단계를 거치므로 저사양/모바일에서 프레임이 튈 수 있다. 현재 차단 이슈는 아니며 시각 best-effort 범위다.

- **CB-216 — `100dvh` 미지원 구버전 Safari**
  `src/components/office-hours-board.tsx` 모바일 경로에서 `h-[100dvh]`를, `src/app/globals.css` body에서 `min-height: 100dvh`를 사용한다. **`100vh` 폴백은 두고 있지 않다.** iOS Safari 15.4 미만 등 구버전에서는 `dvh` 단위를 인식하지 못해 **해당 선언 전체가 무효화**되고, 속성이 초기값(`min-height: auto`, `height: auto`)으로 떨어진다. 결과적으로 뷰포트 높이가 아닌 컨텐츠 높이로 레이아웃이 잡혀 모바일에서 상단/하단 여백과 입력 바 고정 위치가 깨질 수 있다. 데스크탑 경로는 `md:min-h-screen`(=`100vh`)를 병기하므로 영향이 없다. 최근 버전 범위에서는 문제없다.

- **CB-217 — `break-keep` 한글 줄바꿈 엔진별 차이**
  `src/components/office-hours-board.tsx`의 제목과 댓글 본문에서 `break-keep`을 사용한다. `word-break: keep-all`의 해석은 엔진별로 경계 케이스가 달라, 긴 한글 어절이 많은 댓글에서 줄바꿈 위치가 브라우저마다 다를 수 있다. 콘텐츠 유실은 없다.

- **CB-218 — 임의값 타이포(`text-[10px]`, `text-[11px]`) 서브픽셀 편차**
  카드 배지, 타임스탬프, 칩, 업카운트 등에 `text-[10px]`, `text-[11px]`을 광범위하게 사용한다(약 10곳). 서브픽셀 렌더링이 엔진별로 달라 굵기/여백 체감이 달라질 수 있다. 가독성 결함 수준은 아니나 스크린샷 기준 동일성은 보장되지 않는다.

- **CB-219 — 터치 환경 sticky hover**
  `hover:bg-[#4f7dff]`, `hover:bg-[#ff6a5b]`, `hover:-translate-y-0.5` 등 hover 상태가 여러 버튼에 적용되어 있다. iOS/Android 모바일에서 탭 후 hover 상태가 남아 있는 sticky hover 현상이 일부 엔진에서 관찰될 수 있다. 터치 기기 검증 필요.

- **CB-220 — `::selection` 하이라이트 미세 차이**
  `src/app/globals.css`의 `::selection` 커스터마이징은 Blink/WebKit/Gecko 간 렌더링이 살짝 다르다. 텍스트 선택은 모든 지원 브라우저에서 동작하지만 배경 투명도와 텍스트 색 조합 체감이 다를 수 있다.

- **CB-221 — `backdrop-blur-xl` + gradient orb 합성 비용 (Safari)**
  상단/피드 섹션은 `backdrop-blur-xl`을 쓰며, 같은 영역에 `radial-gradient` 배경과 절대 위치 `blur-3xl` orb가 겹쳐 있다(`src/components/office-hours-board.tsx` 446~456 라인 근처). Safari는 backdrop-filter 합성 비용이 상대적으로 크므로 저사양 기기에서 스크롤 프레임이 떨어질 수 있다. **검증 필요** — 실기기 계측 없이 확신하기 어렵다.

- **CB-222 — 미사용 애니메이션 규칙 `.motion-stat-swap`**
  `src/app/globals.css`에 `filter: blur(4px) → blur(0)` 키프레임(`stat-swap`)과 `.motion-stat-swap` 유틸이 정의되어 있으나 현재 컴포넌트 트리에서 참조되지 않는다. 사용 시 Safari의 `filter: blur` 가속 경로 차이로 인한 플리커가 관찰될 수 있다. 지금은 시각 best-effort 범위가 아니라 "장차 되살릴 때 유의할 것" 메모다.

> 검증 필요 항목(실기기 없이 확신이 어려운 것): CB-219, CB-221. 나머지는 코드 정적 확인만으로 존재가 확인된다.

---

## 5. 재논의 트리거

아래 조건이 충족되면 본 문서를 갱신한다. 조건이 충족되기 전에는 버전 숫자를 박지 않는다.

- **웹폰트 도입 (CB-214 관련)**: 공유 스크린샷/캡처에서 **굵기 차이가 육안으로 식별되어** 내부/외부 피드백이 반복적으로 올라오면 재논의한다. 특히 Windows Chrome/Edge 기준 스크린샷이 근거가 된다.
- **iOS 최소 버전 숫자 확정 (CB-216 관련)**: **analytics 도입 또는 타깃 사용자 세그먼트가 확정되어** 실 사용 비율을 근거로 제시할 수 있을 때 재논의한다. 그 전까지는 "최근 버전" 표현만 유지한다.
- **앱 내 미지원 안내 UI 도입**: 지원 외 환경에서 실제 사용자 혼란 리포트가 반복적으로 쌓이면 §2.2의 톤 가이드에 맞춰 설계 논의를 시작한다. 현재는 도입하지 않는다.

---

## 6. 수동 확인 체크리스트

정책 업데이트 시 지원 브라우저 조합에서 아래 플로우를 순서대로 밟는다. 5분 이내 확인이 목표다. 브라우저당 한 벌씩 복사해 써도 된다.

### 대상 브라우저 (각 1회씩)

- [ ] Chrome (데스크탑, 최근 버전)
- [ ] Edge (데스크탑, 최근 버전)
- [ ] Safari (macOS, 최근 버전)
- [ ] iOS Safari (실기기 또는 동등 시뮬레이터, 최근 버전)
- [ ] Android Chrome (실기기 또는 동등 에뮬레이터, 최근 버전)
- [ ] Firefox (데스크탑, 최근 버전) — 시각 best-effort

### 핵심 플로우

- [ ] 1. 페이지 방문 시 주제(예: "주 4일제 도입, 지금 시작해야 하는가?")가 상단에 정상 렌더된다.
- [ ] 2. 상단 찬성 카드 탭 → `1표`로 증가, 게이지가 파란 100%로 이동.
- [ ] 3. 반대 카드 탭 → 투표가 반대로 이동, 게이지가 붉은 100%로 이동.
- [ ] 4. 같은 쪽 재탭 → 투표 취소, 게이지가 0/0으로 돌아옴.
- [ ] 5. 댓글 입력 후 전송 → 목록 상단에 "내 댓글"로 즉시 렌더, 스크롤이 상단으로 이동.
- [ ] 6. 렌더된 댓글의 좋아요 버튼 → 카운트가 1 증가, 재탭 시 감소. 음수로 내려가지 않음.
- [ ] 7. 모바일 뷰포트(≤640px)에서 input+전송 버튼이 한 줄에 표시되고, 작성 입장 칩 줄이 그 위에 따로 존재한다.
- [ ] 8. 주소창 노출/숨김 시 레이아웃이 급격히 깨지지 않는다 (iOS Safari 중점).

문제 발견 시: 차단 금지 범주면 즉시 티켓화, 시각 best-effort 범주면 §4에 CB 번호를 추가해 기록한다.
