"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";

type Side = "blue" | "red";

type ChatMessage = {
  id: number;
  side: Side;
  author: string;
  text: string;
  time: string;
  isLocal?: boolean;
};

const MAX_MESSAGES = 18;

const sideMeta: Record<
  Side,
  {
    label: string;
    title: string;
    summary: string;
    accent: string;
    accentSoft: string;
    headerText: string;
    panelBorder: string;
    panelBackground: string;
    badgeBackground: string;
    bubbleBackground: string;
    localBubbleBackground: string;
    actionBackground: string;
  }
> = {
  blue: {
    label: "찬성",
    title: "주 4일제 도입 찬성",
    summary: "집중 근무, 채용 경쟁력, 번아웃 완화",
    accent: "#155eef",
    accentSoft: "#dbe8ff",
    headerText: "text-blue-950",
    panelBorder: "border-blue-200",
    panelBackground: "bg-[rgba(21,94,239,0.08)]",
    badgeBackground: "bg-blue-100",
    bubbleBackground: "bg-white/90",
    localBubbleBackground: "bg-blue-600 text-white",
    actionBackground: "bg-blue-600 hover:bg-blue-500",
  },
  red: {
    label: "반대",
    title: "주 4일제 도입 반대",
    summary: "운영 공백, 인건비 부담, 서비스 품질 저하",
    accent: "#f04438",
    accentSoft: "#ffe0dc",
    headerText: "text-red-950",
    panelBorder: "border-red-200",
    panelBackground: "bg-[rgba(240,68,56,0.08)]",
    badgeBackground: "bg-red-100",
    bubbleBackground: "bg-white/90",
    localBubbleBackground: "bg-red-500 text-white",
    actionBackground: "bg-red-500 hover:bg-red-400",
  },
};

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    side: "blue",
    author: "기획팀 민지",
    text: "집중 근무제가 같이 들어가면 야근이 줄고 몰입도는 더 올라갈 것 같아요.",
    time: "09:02",
  },
  {
    id: 2,
    side: "red",
    author: "운영팀 현수",
    text: "운영 조직은 주 4일로 바꾸면 당장 인수인계 비용이 커질 수 있습니다.",
    time: "09:04",
  },
  {
    id: 3,
    side: "blue",
    author: "개발팀 유나",
    text: "채용 브랜딩 관점에서는 확실히 강한 메시지가 됩니다.",
    time: "09:05",
  },
  {
    id: 4,
    side: "red",
    author: "영업팀 도윤",
    text: "고객 대응 시간이 줄면 매출 팀은 바로 타격을 받을 수 있어요.",
    time: "09:07",
  },
  {
    id: 5,
    side: "blue",
    author: "디자인팀 소라",
    text: "단순히 하루를 빼는 게 아니라 회의 수를 줄이는 실험까지 같이 해야 합니다.",
    time: "09:08",
  },
  {
    id: 6,
    side: "red",
    author: "재무팀 준호",
    text: "생산성 수치 없이 복지 포인트만으로 가면 내부 설득이 어렵습니다.",
    time: "09:09",
  },
];

const liveReplies: Record<Side, readonly string[]> = {
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

const liveAuthors: Record<Side, readonly string[]> = {
  blue: ["제품팀 하린", "인사팀 재이", "마케팅팀 지호", "개발팀 태린"],
  red: ["운영팀 민석", "세일즈팀 소연", "재무팀 태훈", "CS팀 은별"],
};

function formatTime(date = new Date()) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function pickRandom(items: readonly string[]) {
  return items[Math.floor(Math.random() * items.length)] ?? items[0];
}

function appendMessage(messages: ChatMessage[], nextMessage: ChatMessage) {
  return [...messages, nextMessage].slice(-MAX_MESSAGES);
}

export default function OfficeHoursBoard() {
  const [votes, setVotes] = useState({ blue: 132, red: 118 });
  const [selectedSide, setSelectedSide] = useState<Side>("blue");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isPending, startTransition] = useTransition();

  const totalVotes = votes.blue + votes.red;
  const bluePercent = Math.round((votes.blue / totalVotes) * 1000) / 10;
  const redPercent = Math.round((votes.red / totalVotes) * 1000) / 10;
  const blueMessages = messages.filter((message) => message.side === "blue");
  const redMessages = messages.filter((message) => message.side === "red");

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const side = Math.random() > 0.5 ? "blue" : "red";

      setMessages((current) =>
        appendMessage(current, {
          id: Date.now(),
          side,
          author: pickRandom(liveAuthors[side]),
          text: pickRandom(liveReplies[side]),
          time: formatTime(),
        }),
      );
    }, 9000);

    return () => window.clearInterval(intervalId);
  }, []);

  function handleVote(side: Side) {
    setSelectedSide(side);
    setVotes((current) => ({
      ...current,
      [side]: current[side] + 1,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextDraft = draft.trim();

    if (!nextDraft) {
      return;
    }

    const nextSide = selectedSide;

    setDraft("");

    startTransition(() => {
      setMessages((current) =>
        appendMessage(current, {
          id: Date.now(),
          side: nextSide,
          author: "나",
          text: nextDraft,
          time: formatTime(),
          isLocal: true,
        }),
      );
    });

    window.setTimeout(() => {
      const replySide = nextSide === "blue" ? "red" : "blue";

      setMessages((current) =>
        appendMessage(current, {
          id: Date.now() + 1,
          side: replySide,
          author: pickRandom(liveAuthors[replySide]),
          text: pickRandom(liveReplies[replySide]),
          time: formatTime(),
        }),
      );
    }, 1400);
  }

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/72 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl md:p-8">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#155eef_0%,#155eef_50%,#f04438_50%,#f04438_100%)]" />
          <div className="absolute -left-16 top-20 h-40 w-40 rounded-full bg-[rgba(21,94,239,0.12)] blur-3xl" />
          <div className="absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-[rgba(240,68,56,0.14)] blur-3xl" />

          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                  주 4일제 도입, 지금 시작해야 하는가?
                </h1>
                <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600 md:text-base">
                  위에서는 찬반 투표를 빠르게 집계하고, 아래에서는 두 진영이 실시간으로 의견을
                  주고받는 토론 게시판입니다.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  LIVE {messages.length}개 발언
                </div>
                <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                  투표 참여 {totalVotes}명
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr] xl:gap-3">
              <div className="overflow-hidden rounded-[1.75rem] border border-slate-900 bg-slate-950 text-white xl:flex xl:h-full xl:flex-col">
                <div
                  className="grid gap-px bg-white/10 xl:min-h-0 xl:flex-1"
                  style={{ gridTemplateColumns: `${bluePercent}% ${redPercent}%` }}
                >
                  <button
                    type="button"
                    onClick={() => handleVote("blue")}
                    className={`relative min-h-[168px] overflow-hidden px-6 py-7 text-left transition hover:bg-white/5 xl:h-full ${
                      selectedSide === "blue" ? "ring-2 ring-inset ring-blue-300" : ""
                    }`}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(21,94,239,0.92),rgba(15,23,42,0.8))]" />
                    <div className="relative">
                      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-100">
                        찬성
                      </p>
                      <p className="mt-4 text-5xl font-black tracking-tight">{bluePercent}%</p>
                      <p className="mt-2 text-sm text-blue-100">{votes.blue}표</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleVote("red")}
                    className={`relative min-h-[168px] overflow-hidden px-6 py-7 text-left transition hover:bg-white/5 xl:h-full ${
                      selectedSide === "red" ? "ring-2 ring-inset ring-red-200" : ""
                    }`}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(240,68,56,0.95),rgba(124,45,18,0.9))]" />
                    <div className="relative">
                      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-50">
                        반대
                      </p>
                      <p className="mt-4 text-5xl font-black tracking-tight">{redPercent}%</p>
                      <p className="mt-2 text-sm text-red-100">{votes.red}표</p>
                    </div>
                  </button>
                </div>

                <div className="flex h-3 w-full bg-white/10">
                  <div className="bg-blue-500 transition-[width] duration-500" style={{ width: `${bluePercent}%` }} />
                  <div className="bg-red-500 transition-[width] duration-500" style={{ width: `${redPercent}%` }} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:flex xl:h-[236px] xl:flex-col xl:gap-3">
                <article className="flex min-h-[164px] flex-col justify-center rounded-[1.5rem] border border-blue-200 bg-[rgba(21,94,239,0.1)] p-6 xl:min-h-0 xl:flex-1 xl:p-4">
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-700">찬성 핵심</p>
                  <h2 className="mt-3 text-xl font-black text-slate-950 xl:mt-2 xl:text-lg">
                    근무 시간을 줄여도 성과는 떨어지지 않을 수 있다
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-700 xl:mt-1.5 xl:text-[13px] xl:leading-5">
                    회의와 보고 체계를 줄이고 집중 근무를 설계하면 생산성과 채용 매력도를 같이
                    끌어올릴 수 있다는 주장입니다.
                  </p>
                </article>

                <article className="flex min-h-[164px] flex-col justify-center rounded-[1.5rem] border border-red-200 bg-[rgba(240,68,56,0.1)] p-6 xl:min-h-0 xl:flex-1 xl:p-4">
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-red-700">반대 핵심</p>
                  <h2 className="mt-3 text-xl font-black text-slate-950 xl:mt-2 xl:text-lg">
                    제도보다 운영 현실과 형평성 문제가 먼저다
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-700 xl:mt-1.5 xl:text-[13px] xl:leading-5">
                    고객 응대와 현장 운영 조직은 같은 조건을 적용하기 어렵기 때문에 비용과 업무
                    공백 대책이 선행돼야 한다는 주장입니다.
                  </p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/80 bg-white/72 p-3 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl md:p-4">
          <div className="grid gap-3 xl:grid-cols-2">
            {([
              { side: "blue", messages: blueMessages },
              { side: "red", messages: redMessages },
            ] as const).map(({ side, messages: sideMessages }) => {
              const meta = sideMeta[side];

              return (
                <section
                  key={side}
                  className={`rounded-[1.5rem] border ${meta.panelBorder} ${meta.panelBackground} overflow-hidden`}
                >
                  <header className="flex items-center justify-between border-b border-black/5 px-5 py-4">
                    <div>
                      <p className={`text-xs font-black uppercase tracking-[0.28em] ${meta.headerText}`}>
                        {meta.label} 진영
                      </p>
                      <h2 className="mt-2 text-xl font-black text-slate-950">{meta.title}</h2>
                      <p className="mt-1 text-sm text-slate-600">{meta.summary}</p>
                    </div>
                    <span
                      className={`rounded-full ${meta.badgeBackground} px-3 py-1 text-sm font-semibold ${meta.headerText}`}
                    >
                      {sideMessages.length} messages
                    </span>
                  </header>

                  <div className="flex h-[360px] flex-col gap-3 overflow-y-auto p-4 md:h-[420px]">
                    {sideMessages.map((message) => (
                      <article
                        key={message.id}
                        className={`w-full rounded-[1.4rem] border border-black/5 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] ${
                          message.isLocal ? meta.localBubbleBackground : meta.bubbleBackground
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <p
                            className={`text-sm font-bold ${
                              message.isLocal ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {message.author}
                          </p>
                          <time
                            className={`text-xs font-medium ${
                              message.isLocal ? "text-white/70" : "text-slate-500"
                            }`}
                          >
                            {message.time}
                          </time>
                        </div>
                        <p
                          className={`mt-2 text-sm leading-6 ${
                            message.isLocal ? "text-white/90" : "text-slate-700"
                          }`}
                        >
                          {message.text}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="mt-3 rounded-[1.5rem] bg-slate-950 p-4 text-white md:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Message Console</p>
                <p className="mt-2 text-sm text-slate-300">
                  진영을 고른 뒤 메시지를 보내면 해당 컬럼에 바로 반영됩니다.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {(["blue", "red"] as const).map((side) => {
                  const meta = sideMeta[side];
                  const isActive = selectedSide === side;

                  return (
                    <button
                      key={side}
                      type="button"
                      onClick={() => setSelectedSide(side)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? "bg-white text-slate-950"
                          : "border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {meta.label}으로 발언
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 lg:flex-row">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={`${sideMeta[selectedSide].label} 입장에서 의견을 남겨보세요.`}
                className="h-14 flex-1 rounded-full border border-white/10 bg-white/7 px-5 text-base text-white outline-none ring-0 placeholder:text-slate-500 focus:border-white/30"
              />
              <button
                type="submit"
                disabled={isPending || draft.trim().length === 0}
                className={`h-14 rounded-full px-6 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${sideMeta[selectedSide].actionBackground}`}
              >
                의견 보내기
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
