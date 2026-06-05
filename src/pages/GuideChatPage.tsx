import { type FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ALargeSmall,
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
import { useChatFontSize } from "@/hooks/useChatFontSize";
import { useGuideChat } from "@/hooks/useGuideChat";
import { useLlmSettings } from "@/hooks/useLlmSettings";
import { CHAT_FONT_SIZE_OPTIONS } from "@/lib/chat-font-size";
import { usePatientProfile } from "@/hooks/usePatientProfile";
import { cn } from "@/lib/cn";
import { formatMutationLabels, formatPdl1Label } from "@/lib/guide-patient-context";
import { stripInlineGuidelineSection } from "@/lib/rag";
import { histologyLabel, usesNsclcBiomarkerPanel } from "@/lib/utils";
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
  const chatFont = useChatFontSize();
  const { profile } = usePatientProfile();
  const chat = useGuideChat({ profile }, llm.selectedModelId);
  const endRef = useRef<HTMLDivElement | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
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
        <Card className="mb-4 border-dashed">
          <CardContent className="space-y-2.5 py-3 text-sm text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">환자 정보</span>
              <span className="mx-2 text-muted-foreground/40">·</span>
              {profile.age}세 · {profile.gender === "female" ? "여성" : "남성"}{" "}
              · {histologyLabel(profile.histology)}
              {usesNsclcBiomarkerPanel(profile.histology) && (
                <>
                  <span className="mx-2 text-muted-foreground/40">·</span>
                  변이 {formatMutationLabels(profile.selectedMutations)}
                  <span className="mx-2 text-muted-foreground/40">·</span>
                  PD-L1 {formatPdl1Label(profile.pdl1)}
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span>
                <span className="font-medium text-foreground">챗봇</span>{" "}
                {llm.selectedModel.label}
                {llm.isFreeTier && (
                  <span className="ml-1 text-primary">(무료)</span>
                )}
                {!llm.canUseSelectedModel && (
                  <span className="ml-1 text-amber-600 dark:text-amber-400">
                    (API 키 필요)
                  </span>
                )}
              </span>
              <span className="text-muted-foreground/40">·</span>
              <Link
                to="/"
                className="text-primary underline-offset-4 hover:underline"
              >
                환자 정보 변경
              </Link>
            </div>
          </CardContent>
        </Card>

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
              <MessageSquare className="h-5 w-5 text-primary" />
              가이드라인 기반 상담
            </CardTitle>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              <div
                className="flex items-center gap-0.5 rounded-md border bg-background p-0.5"
                role="group"
                aria-label="채팅 글자 크기"
              >
                <span className="hidden px-1.5 text-[10px] text-muted-foreground sm:inline">
                  <ALargeSmall className="mr-0.5 inline h-3 w-3" />
                  글자
                </span>
                {CHAT_FONT_SIZE_OPTIONS.map((opt) => (
                  <Button
                    key={opt.id}
                    type="button"
                    variant={chatFont.sizeId === opt.id ? "default" : "ghost"}
                    size="sm"
                    className="h-7 px-2 text-[10px]"
                    onClick={() => chatFont.setSize(opt.id)}
                    aria-pressed={chatFont.sizeId === opt.id}
                    aria-label={`글자 크기 ${opt.label}`}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setSettingsOpen(true)}
                aria-label="AI 모델 설정"
              >
                <Settings className="h-3.5 w-3.5" />
                설정
                {!llm.isChatReady && (
                  <span className="text-amber-600 dark:text-amber-400">!</span>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={chat.reset}
                disabled={chat.isChatting || chat.history.length === 0}
                aria-label="채팅 초기화"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                초기화
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="custom-scrollbar min-h-[min(28rem,55vh)] flex-1 space-y-4 overflow-y-auto rounded-lg border bg-muted/30 p-4">
              {chat.history.length === 0 && (
                <div className="flex min-h-[min(24rem,48vh)] flex-col items-center justify-center space-y-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    자동 모드에서는 평소엔 대화하고, 폐암·치료 질문일 때만
                    가이드라인을 찾아 답해요.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {SUGGESTIONS.map((q) => (
                      <Button
                        key={q}
                        variant="outline"
                        size="sm"
                        className="h-auto whitespace-normal px-3 py-2 text-left text-xs"
                        disabled={!llm.isChatReady || !chat.dataReady}
                        onClick={() => chat.setInput(q)}
                      >
                        {q}
                      </Button>
                    ))}
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
                    {msg.role === "ai" &&
                      msg.answerType &&
                      msg.answerType !== "chat" && (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                            msg.answerType === "guideline"
                              ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {msg.answerType === "guideline"
                            ? "가이드라인 기반"
                            : "일반 안내"}
                        </span>
                      )}

                    <div
                      className={cn(
                        "max-w-[90%] rounded-lg px-3 py-2 leading-relaxed",
                        chatFont.className,
                        msg.role === "user"
                          ? "rounded-tr-none bg-primary text-primary-foreground"
                          : "rounded-tl-none border bg-card text-foreground shadow-sm",
                      )}
                    >
                      {msg.role === "ai" ? (
                        <ChatMarkdown
                          content={displayText}
                          className={chatFont.className}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap">{displayText}</p>
                      )}
                    </div>

                    {msg.role === "ai" &&
                      msg.answerType === "guideline" &&
                      !msg.supplementText && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 max-w-[90%] gap-1.5 border-amber-200/80 bg-amber-50/50 text-xs text-amber-900 hover:bg-amber-100/80 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-950/50"
                          disabled={
                            !llm.isChatReady ||
                            chat.isChatting ||
                            chat.supplementLoadingIndex !== null
                          }
                          onClick={() => chat.requestSupplement(i)}
                        >
                          {chat.supplementLoadingIndex === i ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <PlusCircle className="h-3.5 w-3.5" />
                          )}
                          추가 정보
                        </Button>
                      )}

                    {msg.role === "ai" && msg.supplementText && (
                      <div
                        className={cn(
                          "w-full max-w-[90%] rounded-lg border border-sky-200/80 bg-sky-50/90 px-3 py-2.5 leading-relaxed dark:border-sky-900/60 dark:bg-sky-950/35",
                          chatFont.className,
                        )}
                      >
                        <p className="mb-2 text-[10px] font-medium text-sky-800 dark:text-sky-200">
                          추가 안내
                        </p>
                        <ChatMarkdown
                          content={msg.supplementText}
                          className={chatFont.className}
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
                                <p
                                  className={cn(
                                    "mt-1 leading-relaxed text-amber-950/90 dark:text-amber-50/90",
                                    chatFont.className,
                                  )}
                                >
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
              <div ref={endRef} />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {GUIDE_MODE_OPTIONS.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  type="button"
                  variant={chat.guideMode === value ? "default" : "outline"}
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => chat.setGuideMode(value)}
                  disabled={chat.isChatting}
                >
                  <Icon className="h-3.5 w-3.5" />
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
              본 챗봇은 환자 안내 자료 기반 AI 보조 정보이며, 실제 진료는 담당
              의료진과 상의하세요.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GuideChatPage;
