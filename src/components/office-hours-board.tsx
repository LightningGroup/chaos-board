"use client";

import { FormEvent, useEffect, useEffectEvent, useLayoutEffect, useRef, useState, useTransition } from "react";

import {
  appendMessage,
  appendMessages,
  ChatMessage,
  createIncomingMessage,
  createMessage,
  formatTime,
  getFeaturedMessage,
  getMessagesBySide,
  getMostLikedMessage,
  getOppositeSide,
  initialMessages,
  Side,
  toggleMessageLike,
} from "@/components/office-hours-board.model";

const INCOMING_MESSAGE_INTERVAL_MS = 4500;
const REPLY_DELAY_MS = 1400;
const FEED_HEIGHT_CLASS = "h-[420px] md:h-[520px]";
const FEATURED_COLUMN_HEIGHT_CLASS = "xl:h-[212px]";
const EMPTY_AUTHOR_TOKEN = "?";
const ZERO_COUNT = 0;

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

function getMessagePercent(messageCount: number, totalMessageCount: number) {
  if (!totalMessageCount) {
    return ZERO_COUNT;
  }

  return Math.round((messageCount / totalMessageCount) * 1000) / 10;
}

function getAuthorToken(author: string) {
  const nextToken = author.trim().slice(0, 1);

  if (!nextToken) {
    return EMPTY_AUTHOR_TOKEN;
  }

  return nextToken;
}

function getRefreshButtonLabel() {
  return "댓글 새로고침";
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

function DebateOverviewCard({
  blueCount,
  bluePanelWidth,
  bluePercent,
  redCount,
  redPanelWidth,
  redPercent,
  selectedSide,
  onSelect,
}: {
  blueCount: number;
  bluePanelWidth: number;
  bluePercent: number;
  redCount: number;
  redPanelWidth: number;
  redPercent: number;
  selectedSide: Side;
  onSelect: (side: Side) => void;
}) {
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-slate-900 bg-slate-950 text-white xl:flex xl:h-full xl:flex-col">
      <div className="flex gap-px bg-white/10 xl:min-h-0 xl:flex-1">
        <button
          type="button"
          onClick={() => onSelect("blue")}
          style={{ width: `${bluePanelWidth}%` }}
          className={`motion-width relative min-h-[128px] shrink-0 overflow-hidden px-4 py-4 text-left transition-[transform,filter,box-shadow,background-color] duration-[var(--motion-fast)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.992] xl:h-full ${
            selectedSide === "blue" ? "ring-2 ring-inset ring-blue-300" : ""
          }`}
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(21,94,239,0.92),rgba(15,23,42,0.8))]" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-100 md:text-sm">찬성</p>
            <p className="mt-2.5 text-[2.3rem] font-black tracking-tight md:text-[2.7rem]">{bluePercent}%</p>
            <p className="mt-1.5 text-xs text-blue-100 md:text-sm">댓글 {blueCount}개</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect("red")}
          style={{ width: `${redPanelWidth}%` }}
          className={`motion-width relative min-h-[128px] shrink-0 overflow-hidden px-4 py-4 text-left transition-[transform,filter,box-shadow,background-color] duration-[var(--motion-fast)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.992] xl:h-full ${
            selectedSide === "red" ? "ring-2 ring-inset ring-red-200" : ""
          }`}
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(240,68,56,0.95),rgba(124,45,18,0.9))]" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-50 md:text-sm">반대</p>
            <p className="mt-2.5 text-[2.3rem] font-black tracking-tight md:text-[2.7rem]">{redPercent}%</p>
            <p className="mt-1.5 text-xs text-red-100 md:text-sm">댓글 {redCount}개</p>
          </div>
        </button>
      </div>

      <div className="flex h-3 w-full bg-white/10">
        <div className="motion-width bg-blue-500" style={{ width: `${bluePercent}%` }} />
        <div className="motion-width bg-red-500" style={{ width: `${redPercent}%` }} />
      </div>
    </article>
  );
}

function FeaturedOpinionCard({
  message,
  side,
}: {
  message: ChatMessage | null;
  side: Side;
}) {
  const meta = sideMeta[side];

  if (!message) {
    return (
      <article
        className={`flex min-h-[112px] flex-col rounded-[1.45rem] border ${meta.featuredBorder} ${meta.featuredBackground} p-4 xl:min-h-0 xl:flex-1`}
      >
        <p className={`text-xs font-black uppercase tracking-[0.28em] ${meta.featuredText}`}>{meta.label} 핵심</p>
        <p className="mt-1.5 text-[11px] font-semibold text-slate-500">좋아요 1위 의견</p>
        <p className="mt-3 overflow-hidden break-keep text-[13px] leading-5 text-slate-600 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
          아직 대표 의견이 없습니다. 댓글 좋아요가 쌓이면 여기에서 핵심 논점을 보여줍니다.
        </p>
      </article>
    );
  }

  return (
    <article
      className={`flex min-h-[112px] flex-col rounded-[1.45rem] border ${meta.featuredBorder} ${meta.featuredBackground} p-4 xl:min-h-0 xl:flex-1`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-black uppercase tracking-[0.28em] ${meta.featuredText}`}>{meta.label} 핵심</p>
          <p className="mt-1.5 text-[11px] font-semibold text-slate-500">{meta.summary}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border ${meta.chipBorder} ${meta.chipBackground} px-3 py-1 text-xs font-semibold ${meta.chipText}`}
        >
          좋아요 {message.likeCount}
        </span>
      </div>

      <p className="mt-3 overflow-hidden break-keep text-[13px] leading-5 text-slate-700 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
        {message.text}
      </p>

      <div className="mt-auto flex items-center justify-between gap-3 pt-3 text-[12px] font-medium text-slate-500">
        <span>{message.author}</span>
        <time>{message.time}</time>
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
      className={`motion-comment-enter rounded-[1.4rem] border p-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)] transition-[transform,box-shadow,border-color,background-color] duration-[var(--motion-fast)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.08)] ${cardClass}`}
    >
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${avatarClass}`}
        >
          {getAuthorToken(message.author)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {isBest ? (
              <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.2em] text-amber-700">
                Best
              </span>
            ) : null}
            <p className="text-sm font-bold text-slate-950">{message.author}</p>
            {message.isLocal ? (
              <span className="rounded-full bg-slate-950 px-2 py-0.5 text-[11px] font-semibold text-white">내 댓글</span>
            ) : null}
            <time className="text-xs font-medium text-slate-500">{message.time}</time>
          </div>

          <p className="mt-2 break-keep text-[15px] leading-6 text-slate-700">{message.text}</p>
        </div>

        <button
          type="button"
          aria-pressed={message.likedByMe}
          onClick={() => onLike(message.id)}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-[transform,background-color,color,box-shadow,border-color] duration-[var(--motion-fast)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 active:scale-[0.98] ${likeButtonClass}`}
        >
          좋아요 {message.likeCount}
        </button>
      </div>
    </article>
  );
}

export default function OfficeHoursBoard() {
  const [selectedSide, setSelectedSide] = useState<Side>("blue");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [queuedMessages, setQueuedMessages] = useState<ChatMessage[]>([]);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(() => formatTime());
  const [isPending, startTransition] = useTransition();
  const feedRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollBehaviorRef = useRef<ScrollBehavior | null>(null);
  const replyTimeoutIdsRef = useRef<number[]>([]);

  const liveMessages = [...messages, ...queuedMessages];
  const liveBlueMessages = getMessagesBySide(liveMessages, "blue");
  const liveRedMessages = getMessagesBySide(liveMessages, "red");
  const blueFeaturedMessage = getFeaturedMessage(liveMessages, "blue");
  const redFeaturedMessage = getFeaturedMessage(liveMessages, "red");
  const bestMessage = getMostLikedMessage(messages);
  const feedMessages = [...messages].reverse();
  const blueCount = liveBlueMessages.length;
  const redCount = liveRedMessages.length;
  const totalCount = liveMessages.length;
  const queuedMessageCount = queuedMessages.length;
  const bluePercent = getMessagePercent(blueCount, totalCount);
  const redPercent = getMessagePercent(redCount, totalCount);
  const bluePanelWidth = totalCount ? bluePercent : 50;
  const redPanelWidth = totalCount ? redPercent : 50;
  const refreshButtonLabel = getRefreshButtonLabel();

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

  function handleRefreshFeed() {
    if (!queuedMessageCount) {
      setLastRefreshedAt(formatTime());
      return;
    }

    pendingScrollBehaviorRef.current = "smooth";
    setMessages((current) => appendMessages(current, queuedMessages));
    setQueuedMessages([]);
    setLastRefreshedAt(formatTime());
  }

  function handleMessageLike(messageId: string) {
    setMessages((current) => toggleMessageLike(current, messageId));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextDraft = draft.trim();

    if (!nextDraft) {
      return;
    }

    const nextSide = selectedSide;

    setDraft("");
    setLastRefreshedAt(formatTime());
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

    const replyTimeoutId = window.setTimeout(() => {
      const replySide = getOppositeSide(nextSide);

      setQueuedMessages((current) => [...current, createIncomingMessage(replySide)]);
      replyTimeoutIdsRef.current = replyTimeoutIdsRef.current.filter((timeoutId) => timeoutId !== replyTimeoutId);
    }, REPLY_DELAY_MS);

    replyTimeoutIdsRef.current = [...replyTimeoutIdsRef.current, replyTimeoutId];
  }

  return (
    <main className="min-h-screen px-4 py-3 md:px-5 md:py-4 lg:px-6">
      <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-3 md:gap-4">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/76 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl md:p-5">
          <div className="absolute inset-x-0 top-0 flex h-1.5 overflow-hidden">
            <div className="motion-width bg-blue-500" style={{ width: `${bluePercent}%` }} />
            <div className="motion-width bg-red-500" style={{ width: `${redPercent}%` }} />
          </div>
          <div className="absolute -left-16 top-20 h-40 w-40 rounded-full bg-[rgba(21,94,239,0.12)] blur-3xl" />
          <div className="absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-[rgba(240,68,56,0.12)] blur-3xl" />

          <div className="relative flex flex-col gap-3">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h1 className="whitespace-nowrap text-[1.25rem] font-black tracking-tight text-slate-950 sm:text-[2.1rem] xl:text-[3.35rem]">
                  주 4일제 도입, 지금 시작해야 하는가?
                </h1>
              </div>

              <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 text-[11px] font-semibold text-slate-400 md:text-xs lg:shrink-0">
                <span className="shrink-0 whitespace-nowrap text-slate-500">참여 {totalCount}건</span>
                <span aria-hidden="true" className="h-3 w-px shrink-0 bg-slate-200" />
                <span className="shrink-0 whitespace-nowrap">마지막 새로고침 {lastRefreshedAt}</span>
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-[1.25fr_0.75fr]">
              <DebateOverviewCard
                blueCount={blueCount}
                bluePanelWidth={bluePanelWidth}
                bluePercent={bluePercent}
                redCount={redCount}
                redPanelWidth={redPanelWidth}
                redPercent={redPercent}
                selectedSide={selectedSide}
                onSelect={setSelectedSide}
              />

              <div className={`grid gap-3 sm:grid-cols-2 xl:flex xl:flex-col ${FEATURED_COLUMN_HEIGHT_CLASS}`}>
                <FeaturedOpinionCard side="blue" message={blueFeaturedMessage} />
                <FeaturedOpinionCard side="red" message={redFeaturedMessage} />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/80 bg-white/76 shadow-[0_24px_70px_rgba(15,23,42,0.1)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 border-b border-black/6 px-4 py-4 md:flex-row md:items-end md:justify-between md:px-5">
            <div>
              <h2 className="mt-1.5 text-[1.5rem] font-black tracking-tight text-slate-950">전체 댓글</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRefreshFeed}
                className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition-[transform,background-color,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_18px_32px_rgba(15,23,42,0.2)] active:scale-[0.985] md:text-sm"
              >
                {refreshButtonLabel}
              </button>
            </div>
          </div>

          <div ref={feedRef} className={`${FEED_HEIGHT_CLASS} overflow-y-auto px-3 py-3 md:px-4`}>
            <div className="space-y-2.5">
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

        <form onSubmit={handleSubmit} className="rounded-[2rem] bg-slate-950 p-3.5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] md:p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-h-[28px] text-[12px] font-medium leading-5 text-slate-400">
              작성할 때만 입장을 고르고, 피드에서는 댓글을 한 번에 보여줍니다. 좋아요가 많이 쌓인
              댓글은 위 핵심 의견 카드로 올라갑니다.
            </div>

            <div className="flex flex-wrap gap-2">
              {(["blue", "red"] as const).map((side) => {
                const meta = sideMeta[side];
                const isActive = selectedSide === side;
                const activeClass = isActive ? `${meta.chipBackground} ${meta.chipText}` : "border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10";

                return (
                  <button
                    key={side}
                    type="button"
                    onClick={() => setSelectedSide(side)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition-[transform,background-color,color,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 active:scale-[0.98] md:text-sm ${activeClass}`}
                  >
                    {meta.label}으로 작성
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3.5 flex flex-col gap-3 lg:flex-row">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={`${sideMeta[selectedSide].label} 입장에서 의견을 남겨보세요.`}
              className="h-12 flex-1 rounded-full border border-white/10 bg-white/7 px-5 text-[14px] text-white outline-none ring-0 placeholder:text-slate-500 focus:border-white/30"
            />
            <button
              type="submit"
              disabled={isPending || draft.trim().length === 0}
              className={`h-12 rounded-full px-5 text-[14px] font-bold text-white transition-[transform,background-color,box-shadow,opacity] duration-[var(--motion-fast)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(37,99,255,0.32)] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50 ${sideMeta[selectedSide].actionBackground}`}
            >
              의견 보내기
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
