# Chaos Board

찬반 투표와 실시간 토론을 하나의 화면에서 해결하고 싶어서 만든 페이지.

## Screenshots

![Main Screen](./chaos-board.png)

## Quick Start

```bash
# 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start
```

`http://localhost:3000` 에서 확인 가능.

## Tech Stack

- Next.js (App Router)
- React 18
- TypeScript
- Tailwind CSS

## Release Notes

### v0.2.0 (2026-04-14)

**Mobile UI Improvements**

- 모바일에서 "현재 분포" 바 제거 (중복 요소 삭제)
- 찬성/반대 카드 컴팩트화 - 좌우 배치로 변경
- 카드 우측에 퍼센트와 댓글 수 표시
- 요약 텍스트는 데스크톱에서만 표시
- 핵심 의견 영역 완전 제거 (댓글 영역 확보)
- CLAUDE.md 추가 (Claude Code 프로젝트 컨텍스트)
- README.md 프로젝트 설명 개선

### v0.1.0 (2025-04-14)

**Initial Release**

- Office Hours 토론 보드 스캐폴드 추가
- 찬반 투표 UI (주 4일제 도입 논쟁을 예시로 사용)
- 실시간 댓글 피드 (4.5초 간격으로 새 메시지 시뮬레이션)
- 좋아요 및 대표 의견 (Best) 기능
- 인라인 로드모어 버튼 (댓글이 밀려올 때 사용자가 직접 불러옴)
- 요약 카드 레이아웃 개선
- 부드러운 애니메이션 적용
- 모바일 ~ 데스크톱 반응형 디자인
- Netlify 배포 설정
