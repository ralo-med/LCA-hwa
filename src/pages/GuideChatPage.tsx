import { type FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  Loader2,
  MessageSquare,
  MessageSquareText,
  PlusCircle,
  RotateCcw,
  Search,
  Send,
  Settings,
  Sparkles,
} from "lucide-react";
import { ChatMarkdown } from "@/components/chat-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ModelSettingsDialog } from "@/components/ModelSettingsDialog";
import { ShareButton } from "@/components/ShareButton";
import { useGuideChat } from "@/hooks/useGuideChat";
import { useLlmSettings } from "@/hooks/useLlmSettings";
import { usePatientProfile } from "@/hooks/usePatientProfile";
import { useSurvival } from "@/hooks/useSurvival";
import { cn } from "@/lib/cn";
import { stripInlineGuidelineSection } from "@/lib/rag";
import { histologyLabel } from "@/lib/utils";
import type { GuideSearchMode } from "@/types";

const SUGGESTIONS = [
  "항암치료 부작용은 어떻게 관리하나요?",
  "소세포폐암 치료 과정을 알려주세요.",
  "전이성 폐암에서 일상생활 시 주의할 점은?",
  "영양·식이 관리는 어떻게 해야 하나요?",
];

const GUIDE_MODE_OPTIONS: {
  value: GuideSearchMode;
  label: string;
  icon: typeof Sparkles;
}[] = [
  { value: "auto", label: "자동", icon: Sparkles },
  { value: "search", label: "가이드라인 검색", icon: Search },
  { value: "chat", label: "대화만", icon: MessageSquareText },
];

const INPUT_PLACEHOLDER: Record<GuideSearchMode, string> = {
  auto: "메시지를 입력하세요. 필요하면 가이드라인을 찾아 답합니다.",
  search: "가이드라인에서 찾아볼 질문을 입력하세요.",
  chat: "자유롭게 대화해 보세요.",
};

const GuideChatPage = () => {
  const llm = useLlmSettings();
  const { profile } = usePatientProfile();
  const survival = useSurvival(profile);
  const chat = useGuideChat(
    {
      profile,
      survival: survival.isLoading ? undefined : survival.data,
    },
    llm.selectedModelId,
  );
  const listRef = useRef<HTMLDivElement | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const el = listRef.current;
    if (!el || chat.history.length === 0) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [chat.history, chat.isChatting]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    chat.send();
  };

  const disabled =
    !llm.isChatReady || !chat.dataReady || chat.isChatting || !chat.input.trim();

  const loadingMessage =
    chat.loadingPhase === "searching"
      ? "가이드라인을 찾는 중..."
      : "답변 작성 중...";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col p-4 md:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {profile.age}세 {profile.gender === "female" ? "여성" : "남성"} ·{" "}
            {histologyLabel(profile.histology)}
          </span>
          <span className="text-muted-foreground/40">·</span>
          <Link
            to="/dashboard"
            className="text-primary underline-offset-4 hover:underline"
          >
            정보 변경
          </Link>
          {!llm.canUseSelectedModel && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="text-amber-600 underline-offset-4 hover:underline dark:text-amber-400"
              >
                API 키 필요
              </button>
            </>
          )}
        </div>

        <ModelSettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          settings={llm}
          disabled={chat.isChatting}
        />

        {chat.dataError && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {chat.dataError}
          </div>
        )}

        <Card className="flex min-h-0 flex-1 flex-col">
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
                <MessageSquare className="h-4 w-4" />
              </span>
              폐암 안내 도우미
            </CardTitle>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setSettingsOpen(true)}
                aria-label="AI 모델 설정"
              >
                <Settings className="h-4 w-4" />
                설정
                {!llm.isChatReady && (
                  <span className="text-amber-600 dark:text-amber-400">!</span>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={chat.reset}
                disabled={chat.isChatting || chat.history.length === 0}
                aria-label="채팅 초기화"
              >
                <RotateCcw className="h-4 w-4" />
                초기화
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
            <div
              ref={listRef}
              className="custom-scrollbar min-h-[min(28rem,55vh)] flex-1 space-y-4 overflow-y-auto rounded-lg border bg-muted/30 p-4"
            >
              {chat.history.length === 0 && (
                <div className="flex min-h-[min(24rem,48vh)] flex-col items-center justify-center gap-5 text-center">
                  <img
                    src="/images/care.png"
                    alt=""
                    aria-hidden
                    className="h-28 w-28 rounded-full object-cover shadow-sm"
                  />
                  <p className="font-display text-xl font-bold text-foreground">
                    무엇이 궁금하세요?
                  </p>
                  <div className="w-full space-y-2">
                    <div className="flex flex-wrap justify-center gap-2">
                      {SUGGESTIONS.map((q) => (
                        <Button
                          key={q}
                          variant="outline"
                          size="sm"
                          className="h-auto min-h-[44px] whitespace-normal rounded-full px-4 py-2.5 text-left text-sm"
                          disabled={!llm.isChatReady || !chat.dataReady}
                          onClick={() => chat.setInput(q)}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {chat.history.map((msg, i) => {
                const displayText =
                  msg.role === "ai"
                    ? stripInlineGuidelineSection(msg.text)
                    : msg.text;

                return (
                  <div
                    key={i}
                    className={cn(
                      "flex flex-col gap-2",
                      msg.role === "user" ? "items-end" : "items-start",
                    )}
                  >
                    {msg.role === "ai" && (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary">
                          <MessageSquare className="h-3.5 w-3.5" />
                        </span>
                        안내 도우미
                      </div>
                    )}

                    {msg.role === "ai" &&
                      msg.answerType &&
                      msg.answerType !== "chat" && (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                            msg.answerType === "guideline"
                              ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                              : msg.answerType === "survival"
                                ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {msg.answerType === "guideline"
                            ? "가이드라인 기반"
                            : msg.answerType === "survival"
                              ? "대시보드 생존 추정"
                              : "일반 안내"}
                        </span>
                      )}

                    <div
                      className={cn(
                        "max-w-[90%] rounded-2xl px-4 py-2.5 text-base leading-relaxed",
                        msg.role === "user"
                          ? "rounded-tr-sm bg-primary text-primary-foreground"
                          : "rounded-tl-sm border bg-card text-foreground shadow-sm",
                      )}
                    >
                      {msg.role === "ai" ? (
                        <ChatMarkdown content={displayText} className="text-base" />
                      ) : (
                        <p className="whitespace-pre-wrap">{displayText}</p>
                      )}
                    </div>

                    {msg.role === "ai" && displayText.trim() && (
                      <ShareButton
                        payload={{
                          title: "폐암 환자 안내 답변",
                          text: displayText,
                        }}
                        label="공유"
                        variant="ghost"
                        size="sm"
                        className="-ml-1 gap-1.5 text-muted-foreground hover:text-foreground"
                      />
                    )}

                    {msg.role === "ai" &&
                      msg.answerType === "guideline" &&
                      !msg.supplementText && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="max-w-[90%] gap-1.5 border-amber-200/80 bg-amber-50/50 text-amber-900 hover:bg-amber-100/80 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-950/50"
                          disabled={
                            !llm.isChatReady ||
                            chat.isChatting ||
                            chat.supplementLoadingIndex !== null
                          }
                          onClick={() => chat.requestSupplement(i)}
                        >
                          {chat.supplementLoadingIndex === i ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <PlusCircle className="h-4 w-4" />
                          )}
                          추가 정보
                        </Button>
                      )}

                    {msg.role === "ai" && msg.supplementText && (
                      <div className="w-full max-w-[90%] rounded-2xl border border-sky-200/80 bg-sky-50/90 px-4 py-3 text-base leading-relaxed dark:border-sky-900/60 dark:bg-sky-950/35">
                        <p className="mb-2 text-xs font-semibold text-sky-800 dark:text-sky-200">
                          추가 안내
                        </p>
                        <ChatMarkdown
                          content={msg.supplementText}
                          className="text-base"
                        />
                      </div>
                    )}

                    {msg.role === "ai" &&
                      msg.answerType === "guideline" &&
                      msg.sources &&
                      msg.sources.length > 0 && (
                        <details className="group w-full max-w-[90%] rounded-lg border border-amber-200/80 bg-amber-50/90 dark:border-amber-900/60 dark:bg-amber-950/35">
                          <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-amber-900 marker:content-none dark:text-amber-200 [&::-webkit-details-marker]:hidden">
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-90" />
                            가이드라인 원문
                            <span className="font-normal text-amber-800/70 dark:text-amber-300/70">
                              ({msg.sources.length})
                            </span>
                          </summary>
                          <div className="space-y-2 border-t border-amber-200/60 px-3 py-2.5 dark:border-amber-900/40">
                            {msg.sources.map((s, idx) => (
                              <div
                                key={idx}
                                className="rounded-md border border-amber-200/60 bg-white/70 px-2.5 py-2 text-xs dark:border-amber-900/40 dark:bg-amber-950/20"
                              >
                                <p className="font-mono text-[11px] text-amber-800/80 dark:text-amber-300/80">
                                  {s.fileName}
                                  <span className="mx-1">·</span>p.{s.page}
                                </p>
                                <p className="mt-1 text-sm leading-relaxed text-amber-950/90 dark:text-amber-50/90">
                                  {s.excerpt}
                                </p>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                  </div>
                );
              })}

              {chat.isChatting && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {loadingMessage}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {GUIDE_MODE_OPTIONS.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  type="button"
                  variant={chat.guideMode === value ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => chat.setGuideMode(value)}
                  disabled={chat.isChatting}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={chat.input}
                onChange={(e) => chat.setInput(e.target.value)}
                placeholder={INPUT_PLACEHOLDER[chat.guideMode]}
                disabled={!llm.isChatReady || !chat.dataReady}
              />
              <Button
                type="submit"
                disabled={disabled}
                size="icon"
                aria-label="전송"
              >
                <Send />
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              AI 보조 정보이며, 실제 진료는 담당 의료진과 상의하세요.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GuideChatPage;
