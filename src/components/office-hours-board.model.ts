export type Side = "blue" | "red";

export type ChatMessage = {
  id: string;
  side: Side;
  author: string;
  text: string;
  time: string;
  likeCount: number;
  likedByMe: boolean;
  isLocal?: boolean;
};

export const MAX_MESSAGES = 80;

const MIN_LIKE_COUNT = 0;

export const initialMessages: ChatMessage[] = [
  {
    id: "blue-1",
    side: "blue",
    author: "기획팀 민지",
    text: "집중 근무제가 같이 들어가면 야근이 줄고 몰입도는 더 올라갈 것 같아요.",
    time: "09:02",
    likeCount: 4,
    likedByMe: false,
  },
  {
    id: "red-1",
    side: "red",
    author: "운영팀 현수",
    text: "운영 조직은 주 4일로 바꾸면 당장 인수인계 비용이 커질 수 있습니다.",
    time: "09:04",
    likeCount: 5,
    likedByMe: false,
  },
  {
    id: "blue-2",
    side: "blue",
    author: "개발팀 유나",
    text: "채용 브랜딩 관점에서는 확실히 강한 메시지가 됩니다.",
    time: "09:05",
    likeCount: 7,
    likedByMe: false,
  },
  {
    id: "red-2",
    side: "red",
    author: "영업팀 도윤",
    text: "고객 대응 시간이 줄면 매출 팀은 바로 타격을 받을 수 있어요.",
    time: "09:07",
    likeCount: 6,
    likedByMe: false,
  },
  {
    id: "blue-3",
    side: "blue",
    author: "디자인팀 소라",
    text: "단순히 하루를 빼는 게 아니라 회의 수를 줄이는 실험까지 같이 해야 합니다.",
    time: "09:08",
    likeCount: 8,
    likedByMe: false,
  },
  {
    id: "red-3",
    side: "red",
    author: "재무팀 준호",
    text: "생산성 수치 없이 복지 포인트만으로 가면 내부 설득이 어렵습니다.",
    time: "09:09",
    likeCount: 4,
    likedByMe: false,
  },
];

export const liveReplies: Record<Side, readonly string[]> = {
  blue: [
    "시범 조직부터 먼저 돌리면 리스크를 줄이면서 데이터를 확보할 수 있습니다.",
    "채용 경쟁이 심한 직군은 복지보다 근무 구조가 더 큰 차이를 만들 수 있어요.",
    "근무일을 줄이기보다 회의와 보고 체계를 먼저 압축해야 효과가 납니다.",
    "성과 기준을 명확히 하면 오히려 집중도는 더 올라갈 가능성이 큽니다.",
  ],
  red: [
    "고객 대응 팀은 동일 인력으로는 커버가 어렵고 결국 추가 채용이 필요합니다.",
    "복지 제도는 좋지만 운영 지표가 따라오지 않으면 바로 반발이 생길 겁니다.",
    "업무량이 그대로면 근무일만 줄어드는 구조가 되어 체감 피로는 더 커질 수 있어요.",
    "백오피스와 현장 조직 간 형평성 이슈도 먼저 정리해야 합니다.",
  ],
};

export const liveAuthors: Record<Side, readonly string[]> = {
  blue: ["제품팀 하린", "인사팀 재이", "마케팅팀 지호", "개발팀 태린"],
  red: ["운영팀 민석", "세일즈팀 소연", "재무팀 태훈", "CS팀 은별"],
};

const timeFormatter = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** 현재 시각을 댓글 타임스탬프 형식으로 만든다. 실시간 댓글과 사용자 댓글 등록 시 사용한다. */
export function formatTime(date = new Date()) {
  return timeFormatter.format(date);
}

/** 실시간 더미 데이터에서 임의 항목 하나를 고른다. 라이브 댓글과 작성자 샘플 생성에 사용한다. */
export function pickRandom(items: readonly string[]) {
  return items[Math.floor(Math.random() * items.length)] ?? items[0];
}

/** 새 댓글 객체를 기본 필드와 함께 생성한다. 클라이언트 상태에 댓글을 추가할 때 사용한다. */
export function createMessage({
  author,
  isLocal,
  side,
  text,
}: {
  author: string;
  isLocal?: boolean;
  side: Side;
  text: string;
}) {
  return {
    id: createMessageId(),
    side,
    author,
    text,
    time: formatTime(),
    likeCount: MIN_LIKE_COUNT,
    likedByMe: false,
    isLocal,
  } satisfies ChatMessage;
}

/** 진영별 더미 데이터를 사용해 외부 유입 댓글을 생성한다. 수동 새로고침 전 대기 큐에 넣을 때 사용한다. */
export function createIncomingMessage(side: Side) {
  return createMessage({
    author: pickRandom(liveAuthors[side]),
    side,
    text: pickRandom(liveReplies[side]),
  });
}

/** 댓글 목록에 새 댓글을 추가한다. 화면 메모리와 스크롤 부담을 줄이기 위해 최근 항목만 유지한다. */
export function appendMessage(messages: ChatMessage[], nextMessage: ChatMessage) {
  return [...messages, nextMessage].slice(-MAX_MESSAGES);
}

/** 여러 댓글을 한 번에 병합한다. 수동 새로고침으로 대기 댓글을 반영할 때 사용한다. */
export function appendMessages(messages: ChatMessage[], nextMessages: ChatMessage[]) {
  return [...messages, ...nextMessages].slice(-MAX_MESSAGES);
}

/** 각 진영의 댓글 목록을 시간순으로 분리한다. 목록 렌더링과 통계 계산에 사용한다. */
export function getMessagesBySide(messages: ChatMessage[], side: Side) {
  return messages.filter((message) => message.side === side);
}

/** 사용자가 좋아요를 토글한다. 같은 댓글에는 한 번만 반영되고 취소 시 카운트가 내려간다. */
export function toggleMessageLike(messages: ChatMessage[], messageId: string) {
  return messages.map((message) => {
    if (message.id !== messageId) {
      return message;
    }

    const nextLikedByMe = !message.likedByMe;
    const nextLikeCount = nextLikedByMe ? message.likeCount + 1 : Math.max(MIN_LIKE_COUNT, message.likeCount - 1);

    return {
      ...message,
      likedByMe: nextLikedByMe,
      likeCount: nextLikeCount,
    };
  });
}

/** 전체 댓글에서 가장 공감을 많이 받은 댓글을 고른다. BEST 표시가 필요한 피드 목록에서 사용한다. */
export function getMostLikedMessage(messages: ChatMessage[]) {
  return messages.reduce<ChatMessage | null>((bestMessage, message) => {
    if (!bestMessage) {
      return message;
    }

    if (message.likeCount > bestMessage.likeCount) {
      return message;
    }

    if (message.likeCount < bestMessage.likeCount) {
      return bestMessage;
    }

    return message;
  }, null);
}

/** 선택된 진영의 반대편 진영을 구한다. 자동 응답 댓글 방향을 결정할 때 사용한다. */
export function getOppositeSide(side: Side) {
  if (side === "blue") {
    return "red";
  }

  return "blue";
}
