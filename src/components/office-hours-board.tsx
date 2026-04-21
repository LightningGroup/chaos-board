"use client";

import { FormEvent, useEffect, useEffectEvent, useLayoutEffect, useRef, useState, useTransition } from "react";

import {
  appendMessage,
  appendMessages,
  applyVote,
  applyVoteCounts,
  ChatMessage,
  createIncomingMessage,
  createInitialVoteCounts,
  createMessage,
  getMostLikedMessage,
  getOppositeSide,
  getVoteRatio,
  initialMessages,
  Side,
  toggleMessageLike,
  Vote,
  VoteCounts,
} from "@/components/office-hours-board.model";

const INCOMING_MESSAGE_INTERVAL_MS = 4500;
const REPLY_DELAY_MS = 1400;
const FEED_LAYOUT_CLASS = "min-h-0 flex-1 md:h-[520px] md:flex-none";
const EMPTY_AUTHOR_TOKEN = "?";
const ZERO_COUNT = 0;
const SIMULATED_TRAFFIC_FLAG_ON = "on";
const SIMULATED_TRAFFIC_ENABLED =
  process.env.NEXT_PUBLIC_SIMULATED_TRAFFIC === SIMULATED_TRAFFIC_FLAG_ON;

const sideMeta: Record<
  Side,
  {
    label: string;
    summary: string;
    title: string;
    chipBackground: string;
    chipBorder: string;
    chipText: string;
    featuredBackground: string;
    featuredBorder: string;
    featuredText: string;
    actionBackground: string;
  }
> = {
  blue: {
    label: "찬성",
    summary: "집중 근무, 채용 경쟁력, 번아웃 완화",
    title: "주 4일제 도입 찬성",
    chipBackground: "bg-blue-50",
    chipBorder: "border-blue-200",
    chipText: "text-blue-700",
    featuredBackground: "bg-[rgba(21,94,239,0.08)]",
    featuredBorder: "border-blue-200",
    featuredText: "text-blue-900",
    actionBackground: "bg-[#2563ff] hover:bg-[#4f7dff]",
  },
  red: {
    label: "반대",
    summary: "운영 공백, 인건비 부담, 서비스 품질 저하",
    title: "주 4일제 도입 반대",
    chipBackground: "bg-red-50",
    chipBorder: "border-red-200",
    chipText: "text-red-700",
    featuredBackground: "bg-[rgba(240,68,56,0.08)]",
    featuredBorder: "border-red-200",
    featuredText: "text-red-900",
    actionBackground: "bg-[#ff4d3d] hover:bg-[#ff6a5b]",
  },
};

function getAuthorToken(author: string) {
  const nextToken = author.trim().slice(0, 1);

  if (!nextToken) {
    return EMPTY_AUTHOR_TOKEN;
  }

  return nextToken;
}

function getOverviewButtonClass({
  side,
}: {
  side: Side;
}) {
  if (side === "blue") {
    return "border-blue-200 bg-[rgba(21,94,239,0.08)] text-slate-950 shadow-[0_10px_30px_rgba(21,94,239,0.08)]";
  }

  if (side === "red") {
    return "border-red-200 bg-[rgba(240,68,56,0.08)] text-slate-950 shadow-[0_10px_30px_rgba(240,68,56,0.08)]";
  }

  return "border-slate-200 bg-white text-slate-700";
}

function scrollFeedToTop(container: HTMLDivElement | null, behavior: ScrollBehavior) {
  if (!container) {
    return;
  }

  container.scrollTo({
    top: ZERO_COUNT,
    behavior,
  });
}

function getMessageCardClass({
  isBest,
  isLocal,
}: {
  isBest: boolean;
  isLocal?: boolean;
}) {
  if (isBest && isLocal) {
    return "border-amber-300 bg-[linear-gradient(135deg,rgba(245,158,11,0.14),rgba(255,255,255,0.96))]";
  }

  if (isBest) {
    return "border-amber-300 bg-[rgba(245,158,11,0.08)]";
  }

  if (isLocal) {
    return "border-slate-300 bg-[rgba(15,23,42,0.04)]";
  }

  return "border-black/6 bg-white";
}

function getLikeButtonClass({
  isActive,
  isBest,
}: {
  isActive: boolean;
  isBest: boolean;
}) {
  if (isActive && isBest) {
    return "bg-slate-950 text-white shadow-[0_14px_28px_rgba(15,23,42,0.2)]";
  }

  if (isActive) {
    return "bg-blue-600 text-white shadow-[0_14px_28px_rgba(37,99,235,0.22)]";
  }

  if (isBest) {
    return "border border-amber-300 bg-white text-amber-700";
  }

  return "border border-black/8 bg-white text-slate-600 hover:bg-slate-50";
}

function getVoteButtonAriaLabel({
  side,
  isVoted,
  percent,
}: {
  side: Side;
  isVoted: boolean;
  percent: number;
}) {
  const label = side === "blue" ? "찬성" : "반대";
  const action = isVoted ? "투표 취소" : "투표";

  return `${label} ${action}, 현재 ${Math.round(percent)}%`;
}

function DebateOverviewCard({
  voteCounts,
  bluePercent,
  redPercent,
  votedSide,
  onVote,
}: {
  voteCounts: VoteCounts;
  bluePercent: number;
  redPercent: number;
  votedSide: Side | null;
  onVote: (side: Side) => void;
}) {
  return (
    <article
      aria-label="찬성 반대 투표와 현재 투표 비율"
      className="overflow-hidden border border-slate-200 bg-white text-slate-950 xl:flex xl:h-full xl:flex-col"
    >
      <div className="grid gap-1 p-1.5 sm:gap-2 sm:p-2 md:p-2 xl:min-h-0 xl:flex-1">
        <button
          type="button"
          aria-pressed={votedSide === "blue"}
          aria-label={getVoteButtonAriaLabel({ side: "blue", isVoted: votedSide === "blue", percent: bluePercent })}
          onClick={() => onVote("blue")}
          className={`relative flex items-center justify-between border px-2.5 py-2 text-left transition-[box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-smooth)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 md:min-h-[100px] md:px-4 md:py-4 ${getOverviewButtonClass({
            side: "blue",
          })}`}
        >
          <div className="flex min-w-0 flex-col">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-700 md:text-xs md:tracking-[0.24em]">
              {votedSide === "blue" ? "찬성 · 내 투표" : "찬성"}
            </p>
            <p className="mt-0 text-[1rem] font-black tracking-tight text-slate-950 md:mt-2 md:text-[1.6rem] lg:text-[1.9rem]">지금 시작</p>
            <p className="mt-1 line-clamp-1 text-[11px] text-slate-600 md:mt-3 md:line-clamp-none md:text-sm">집중 근무, 채용 경쟁력, 번아웃 완화</p>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-[1.125rem] font-black tracking-tight text-slate-950 md:text-[1.95rem] lg:text-[2.2rem]">{bluePercent}%</p>
            <p className="mt-0 text-[11px] font-medium text-slate-500 md:mt-1 md:text-xs">{voteCounts.blue}표</p>
          </div>
        </button>

        <button
          type="button"
          aria-pressed={votedSide === "red"}
          aria-label={getVoteButtonAriaLabel({ side: "red", isVoted: votedSide === "red", percent: redPercent })}
          onClick={() => onVote("red")}
          className={`relative flex items-center justify-between border px-2.5 py-2 text-left transition-[box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-smooth)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 md:min-h-[100px] md:px-4 md:py-4 ${getOverviewButtonClass({
            side: "red",
          })}`}
        >
          <div className="flex min-w-0 flex-col">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-red-700 md:text-xs md:tracking-[0.24em]">
              {votedSide === "red" ? "반대 · 내 투표" : "반대"}
            </p>
            <p className="mt-0 text-[1rem] font-black tracking-tight text-slate-950 md:mt-2 md:text-[1.6rem] lg:text-[1.9rem]">조정이 먼저</p>
            <p className="mt-1 line-clamp-1 text-[11px] text-slate-600 md:mt-3 md:line-clamp-none md:text-sm">운영 공백, 인건비 부담, 서비스 품질 저하</p>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-[1.125rem] font-black tracking-tight text-slate-950 md:text-[1.95rem] lg:text-[2.2rem]">{redPercent}%</p>
            <p className="mt-0 text-[11px] font-medium text-slate-500 md:mt-1 md:text-xs">{voteCounts.red}표</p>
          </div>
        </button>
      </div>
    </article>
  );
}

function MessageCard({
  isBest,
  message,
  onLike,
}: {
  isBest: boolean;
  message: ChatMessage;
  onLike: (messageId: string) => void;
}) {
  const cardClass = getMessageCardClass({
    isBest,
    isLocal: message.isLocal,
  });
  const likeButtonClass = getLikeButtonClass({
    isActive: message.likedByMe,
    isBest,
  });
  const avatarClass = message.isLocal ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700";

  return (
    <article
      data-message-id={message.id}
      className={`motion-comment-enter border px-2 py-1.5 shadow-[0_14px_36px_rgba(15,23,42,0.05)] transition-[transform,box-shadow,border-color,background-color] duration-[var(--motion-fast)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.08)] md:p-4 ${cardClass}`}
    >
      <div className="flex items-start gap-2 md:gap-3">
        <div
          aria-hidden="true"
          className={`flex h-7 w-7 shrink-0 items-center justify-center text-[11px] font-black md:h-10 md:w-10 md:text-sm ${avatarClass}`}
        >
          {getAuthorToken(message.author)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
            {isBest ? (
              <span className="border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.15em] text-amber-700 md:px-2 md:text-[11px] md:tracking-[0.2em]">
                Best
              </span>
            ) : null}
            <p className="text-[13px] font-bold text-slate-950 md:text-sm">{message.author}</p>
            {message.isLocal ? (
              <span className="bg-slate-950 px-1.5 py-0.5 text-[10px] font-semibold text-white md:px-2 md:text-[11px]">내 댓글</span>
            ) : null}
            <time className="text-[11px] font-medium text-slate-500 md:text-xs">{message.time}</time>
          </div>

          <p className="mt-1 break-keep text-[14px] leading-5 text-slate-700 md:mt-2 md:text-[15px] md:leading-6">{message.text}</p>
        </div>

        <button
          type="button"
          aria-pressed={message.likedByMe}
          onClick={() => onLike(message.id)}
          className={`shrink-0 px-3 py-2 text-[12px] font-semibold transition-[transform,background-color,color,box-shadow,border-color] duration-[var(--motion-fast)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 active:scale-[0.98] md:px-3.5 md:py-2 md:text-xs ${likeButtonClass}`}
        >
          좋아요 {message.likeCount}
        </button>
      </div>
    </article>
  );
}

type VoteState = {
  myVote: Vote | null;
  counts: VoteCounts;
};

function createInitialVoteState(): VoteState {
  return {
    myVote: null,
    counts: createInitialVoteCounts(),
  };
}

export default function OfficeHoursBoard() {
  const [composerSide, setComposerSide] = useState<Side>("blue");
  const [voteState, setVoteState] = useState<VoteState>(createInitialVoteState);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [queuedMessages, setQueuedMessages] = useState<ChatMessage[]>([]);
  const [isPending, startTransition] = useTransition();
  const feedRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollBehaviorRef = useRef<ScrollBehavior | null>(null);
  const replyTimeoutIdsRef = useRef<number[]>([]);

  const { myVote, counts: voteCounts } = voteState;
  const liveMessages = [...messages, ...queuedMessages];
  const bestMessage = getMostLikedMessage(messages);
  const feedMessages = [...messages].reverse();
  const commentCount = liveMessages.length;
  const queuedMessageCount = queuedMessages.length;
  const voteRatio = getVoteRatio(voteCounts);
  const bluePercent = voteRatio.bluePercent;
  const redPercent = voteRatio.redPercent;
  const votedSide = myVote?.side ?? null;

  useLayoutEffect(() => {
    const nextBehavior = pendingScrollBehaviorRef.current;

    if (!nextBehavior) {
      return;
    }

    pendingScrollBehaviorRef.current = null;
    scrollFeedToTop(feedRef.current, nextBehavior);
  }, [messages]);

  const queueIncomingMessage = useEffectEvent((side: Side) => {
    setQueuedMessages((current) => [...current, createIncomingMessage(side)]);
  });

  useEffect(() => {
    if (!SIMULATED_TRAFFIC_ENABLED) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const nextSide = Math.random() > 0.5 ? "blue" : "red";

      queueIncomingMessage(nextSide);
    }, INCOMING_MESSAGE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    return () => {
      replyTimeoutIdsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    };
  }, []);

  function handleLoadMore() {
    if (!queuedMessageCount) {
      return;
    }

    pendingScrollBehaviorRef.current = "smooth";
    setMessages((current) => appendMessages(current, queuedMessages));
    setQueuedMessages([]);
  }

  function handleMessageLike(messageId: string) {
    setMessages((current) => toggleMessageLike(current, messageId));
  }

  function handleVote(side: Side) {
    const isUndo = myVote?.side === side;

    setVoteState((current) => {
      const nextVote = applyVote(current.myVote, side);
      const nextCounts = applyVoteCounts(current.counts, current.myVote, nextVote);

      return { myVote: nextVote, counts: nextCounts };
    });

    if (isUndo) {
      return;
    }

    setComposerSide(side);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextDraft = draft.trim();

    if (!nextDraft) {
      return;
    }

    const nextSide = composerSide;

    setDraft("");
    pendingScrollBehaviorRef.current = "smooth";

    startTransition(() => {
      setMessages((current) =>
        appendMessage(
          current,
          createMessage({
            author: "나",
            isLocal: true,
            side: nextSide,
            text: nextDraft,
          }),
        ),
      );
    });

    if (!SIMULATED_TRAFFIC_ENABLED) {
      return;
    }

    const replyTimeoutId = window.setTimeout(() => {
      const replySide = getOppositeSide(nextSide);

      setQueuedMessages((current) => [...current, createIncomingMessage(replySide)]);
      replyTimeoutIdsRef.current = replyTimeoutIdsRef.current.filter((timeoutId) => timeoutId !== replyTimeoutId);
    }, REPLY_DELAY_MS);

    replyTimeoutIdsRef.current = [...replyTimeoutIdsRef.current, replyTimeoutId];
  }

  return (
    <main className="flex h-[100dvh] flex-col md:block md:h-auto md:min-h-screen md:px-5 md:py-4 lg:px-6">
      <div className="mx-auto flex w-full max-w-[1080px] flex-1 min-h-0 flex-col md:gap-4">
        <section className="relative overflow-hidden border-b border-white/80 bg-white/76 p-2 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl md:border md:p-4 lg:p-5">
          <div
            role="img"
            aria-label={`투표 기준 찬반 비율: 찬성 ${Math.round(bluePercent)}%, 반대 ${Math.round(redPercent)}%`}
            className="absolute inset-x-0 top-0 flex h-1.5 overflow-hidden"
          >
            <div className="motion-width bg-blue-500" style={{ width: `${bluePercent}%` }} />
            <div className="motion-width bg-red-500" style={{ width: `${redPercent}%` }} />
          </div>
          <div className="absolute -left-16 top-20 h-40 w-40 bg-[rgba(21,94,239,0.12)] blur-3xl" />
          <div className="absolute -right-16 bottom-0 h-48 w-48 bg-[rgba(240,68,56,0.12)] blur-3xl" />

          <div className="relative flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <h1 className="break-keep text-[1.375rem] font-black leading-tight tracking-tight text-slate-950 sm:whitespace-nowrap sm:text-[2.1rem] sm:leading-normal xl:text-[3.35rem]">
                주 4일제 도입, 지금 시작해야 하는가?
              </h1>
              <p className="text-[11px] font-medium text-slate-500 md:text-xs">
                투표 {voteCounts.total}표 · 댓글 {commentCount}개
              </p>
            </div>

            <div className="grid gap-2">
              <DebateOverviewCard
                voteCounts={voteCounts}
                bluePercent={bluePercent}
                redPercent={redPercent}
                votedSide={votedSide}
                onVote={handleVote}
              />
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col bg-white/76 shadow-[0_24px_70px_rgba(15,23,42,0.1)] backdrop-blur-xl md:min-h-[auto] md:flex-initial md:border md:border-white/80">
          <div className="flex items-end justify-between border-b border-black/6 px-2 py-1.5 md:px-5 md:py-4">
            <h2 className="text-[1.0625rem] font-black tracking-tight text-slate-950 md:mt-1.5 md:text-[1.5rem]">전체 댓글</h2>

            {queuedMessageCount > 0 ? (
              <button
                type="button"
                onClick={handleLoadMore}
                className="flex items-center gap-1 bg-slate-950 px-3.5 py-2 text-[12px] font-semibold text-white transition-[transform,background-color,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_18px_32px_rgba(15,23,42,0.2)] active:scale-[0.985] md:text-xs md:px-4 md:py-2"
              >
                {queuedMessageCount}개의 새 댓글 더보기
              </button>
            ) : null}
          </div>

          <div ref={feedRef} className={`${FEED_LAYOUT_CLASS} overflow-y-auto px-1.5 py-1.5 md:px-4 md:py-3`}>
            <div className="space-y-1 md:space-y-2">
              {feedMessages.map((message) => (
                <MessageCard
                  key={message.id}
                  isBest={bestMessage?.id === message.id}
                  message={message}
                  onLike={handleMessageLike}
                />
              ))}
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="bg-slate-950 p-2 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] md:p-4">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="shrink-0 text-slate-400">작성 입장</span>
            <div className="flex gap-1">
              {(["blue", "red"] as const).map((side) => {
                const meta = sideMeta[side];
                const isActive = composerSide === side;
                const activeClass = isActive ? `${meta.chipBackground} ${meta.chipText}` : "border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10";

                return (
                  <button
                    key={side}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setComposerSide(side)}
                    className={`whitespace-nowrap px-2 py-1 text-[11px] font-semibold transition-[background-color,color,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-smooth)] md:px-2.5 ${activeClass}`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-1.5 flex flex-row items-center gap-1.5 md:mt-2 md:gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={`${sideMeta[composerSide].label} 입장에서 한 줄 남기기`}
              className="h-11 min-w-0 flex-1 border border-white/10 bg-white/7 px-3.5 py-1.5 text-[16px] text-white outline-none ring-0 placeholder:text-slate-500 focus:border-white/30 sm:h-10 sm:px-4 sm:py-0 md:h-12 md:text-[14px]"
            />
            <button
              type="submit"
              disabled={isPending || draft.trim().length === 0}
              className={`h-11 shrink-0 px-3.5 text-[13px] font-bold text-white transition-[transform,background-color,box-shadow,opacity] duration-[var(--motion-fast)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(37,99,235,0.32)] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:px-4 sm:text-[13px] md:h-12 md:text-[14px] ${sideMeta[composerSide].actionBackground}`}
            >
              보내기
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
