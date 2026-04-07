# AGENTS.md

## 1. Scope
이 문서는 `src/` 아래 프론트엔드 코드에만 적용한다.

---

## 2. Project Facts
- 프론트엔드 앱은 JavaScript + React 18 기반이다.
- 빌드/개발 도구는 Vite 5 + @vitejs/plugin-react 다.
- 패키지 설정은 `"type": "module"`이며 ESM `import/export`를 사용한다.
- SPA 엔트리포인트는 `src/main.jsx`이고, `App`을 `#root`에 마운트한다.
- 전역 상태 라이브러리(Redux, Zustand 등)는 사용하지 않고, React state 및 커스텀 훅으로 상태를 관리한다.
- 런타임 영속 값은 `useLocalStorage`를 통해 `localStorage`에 저장한다.
- 네트워크 호출은 `fetch` 기반이며 `src/api/client.js`의 `apiClient`로 중앙화되어 있다.
- 서버 인증은 `Authorization: Bearer <token>` 헤더를 사용한다.
- 폴링은 `useJobPolling` 훅에서 `setInterval`로 처리한다.
- 정규화/파싱 유틸(`normalizeBaseUrl`, `parseListInput`)이 분리되어 있다.

---

## 3. Frontend Architecture Rules
- 도메인 규칙과 UI 컴포넌트를 분리한다.
- 컴포넌트는 표현과 이벤트 연결에 집중한다.
- 변환, 정규화, 파싱은 순수 함수로 분리한다.
- 네트워크 호출은 API client/adapter 계층으로 모은다.
- `localStorage`, network, timer 같은 부수효과는 hook/service/adapter에 모은다.
- 비즈니스 규칙을 컴포넌트 body 전반에 흩뿌리지 않는다.
- 훅은 오케스트레이션, 유틸은 순수 변환, 컴포넌트는 렌더링/이벤트 연결을 담당한다.

---

## 4. State and Data Rules
- 상태는 현재 레포 방식(React state + 훅)과 일관되게 다룬다.
- 전역 상태 라이브러리가 없는 영역에는 새 상태 솔루션을 임의로 도입하지 않는다.
- 새 상태 관리 도구 도입은 성능, 복잡도, 공유 범위 문제를 근거로 명시적으로 제안할 때만 허용한다.
- 원시 객체와 배열을 직접 변이하지 않는다.
- 상태 전이는 명시적 함수, 유스케이스, 도메인 메서드로 표현한다.
- 데이터 정규화, 검증, 변환은 별도 함수로 분리한다.

---

## 5. Networking and IO Rules
- 네트워크 호출은 중앙 client/adapter에 모은다.
- 컴포넌트에서 URL 조합, 헤더 조합, 에러 파싱 로직을 반복 작성하지 않는다.
- 외부 I/O는 boundary에서 처리한다.
- 도메인 계층은 브라우저 API 및 네트워크 세부 구현을 알지 않도록 유지한다.
- 신규 호출도 기본적으로 현재 fetch + apiClient 패턴을 따른다.

---

## 6. React Guidance
- 컴포넌트는 작고 읽기 쉽게 유지한다.
- 큰 컴포넌트는 패널, 폼, 리스트, 상세 등 역할 기준으로 분리한다.
- 훅은 재사용 가능한 상태, 동기화, 오케스트레이션 로직에 사용한다.
- 렌더링 코드와 데이터 준비 코드를 분리한다.
- 폼 파싱, 목록 정규화, 에러 메시지 변환은 util/usecase로 분리한다.
- 뷰는 thin 하게 유지한다.

---

## 7. OOP and FP Usage
- OOP는 책임 있는 객체, 상태 전이, 도메인 규칙, 응집된 행위에 사용한다.
- FP는 변환, 정규화, 매핑, 필터링, 조합, 파이프라인, 파생 계산에 사용한다.
- 도메인 객체는 가능한 명시적인 행위를 제공한다.
- 순수 계산 로직은 순수 함수로 유지한다.
- 객체와 함수의 역할이 섞이지 않도록 경계를 유지한다.

---

## 8. JSDoc Rules
- public 함수, 도메인 메서드, 유스케이스, 복잡한 유틸에는 JSDoc을 작성한다.
- 한국어로 짧고 명료하게 작성한다.
- "무엇을 하는지"와 "언제 쓰는지"를 드러낸다.
- 구현을 줄 단위로 반복 설명하는 주석은 금지한다.