import { type FormEvent, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  MessageSquare,
  MessageSquareText,
  Search,
  Send,
  Sparkles,
} from 'lucide-react';
import { ChatMarkdown } from '@/components/chat-markdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { useGuideChat } from '@/hooks/useGuideChat';
import { usePatientProfile } from '@/hooks/usePatientProfile';
import { isOpenAIConfigured } from '@/constants';
import { cn } from '@/lib/cn';
import { stripInlineGuidelineSection } from '@/lib/rag';
import { histologyLabel } from '@/lib/utils';
import type { GuideSearchMode } from '@/types';

const SUGGESTIONS = [
  '항암치료 부작용은 어떻게 관리하나요?',
  '소세포폐암 치료 과정을 알려주세요.',
  '전이성 폐암에서 일상생활 시 주의할 점은?',
  '영양·식이 관리는 어떻게 해야 하나요?',
];

const GUIDE_MODE_OPTIONS: {
  value: GuideSearchMode;
  label: string;
  icon: typeof Sparkles;
}[] = [
  { value: 'auto', label: '자동', icon: Sparkles },
  { value: 'search', label: '가이드라인 검색', icon: Search },
  { value: 'chat', label: '대화만', icon: MessageSquareText },
];

const INPUT_PLACEHOLDER: Record<GuideSearchMode, string> = {
  auto: '메시지를 입력하세요. 필요하면 가이드라인을 찾아 답합니다.',
  search: '가이드라인에서 찾아볼 질문을 입력하세요.',
  chat: '자유롭게 대화해 보세요.',
};

const GuideChatPage = () => {
  const aiReady = isOpenAIConfigured();
  const { profile } = usePatientProfile();
  const chat = useGuideChat(profile);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.history, chat.isChatting]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    chat.send();
  };

  const disabled =
    !aiReady || !chat.dataReady || chat.isChatting || !chat.input.trim();

  const loadingMessage =
    chat.loadingPhase === 'searching'
      ? '가이드라인을 찾는 중...'
      : '답변 작성 중...';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col p-4 md:p-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/" aria-label="대시보드로 돌아가기">
                <ArrowLeft />
              </Link>
            </Button>
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold md:text-2xl">
                <BookOpen className="h-6 w-6 text-primary" />
                환자 안내 챗봇
              </h1>
              <p className="text-sm text-muted-foreground">
                폐암 환자 가이드라인 PDF 기반 Q&amp;A
              </p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <Card className="mb-4 border-dashed">
          <CardContent className="py-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">현재 프로필:</span>{' '}
            {profile.age}세 · {profile.gender === 'female' ? '여성' : '남성'} ·{' '}
            {histologyLabel(profile.histology)}
            <span className="mx-2 text-muted-foreground/40">|</span>
            <Link to="/" className="text-primary underline-offset-4 hover:underline">
              대시보드에서 변경
            </Link>
          </CardContent>
        </Card>

        {chat.dataError && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {chat.dataError}
          </div>
        )}

        <Card className="flex flex-1 flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-5 w-5 text-primary" />
              가이드라인 기반 상담
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-4">
            <div className="custom-scrollbar min-h-[420px] flex-1 space-y-4 overflow-y-auto rounded-lg border bg-muted/30 p-4">
              {chat.history.length === 0 && (
                <div className="space-y-4 py-6 text-center">
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
                        disabled={!aiReady || !chat.dataReady}
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
                  msg.role === 'ai'
                    ? stripInlineGuidelineSection(msg.text)
                    : msg.text;

                return (
                  <div
                    key={i}
                    className={cn(
                      'flex flex-col gap-2',
                      msg.role === 'user' ? 'items-end' : 'items-start',
                    )}
                  >
                    {msg.role === 'ai' && msg.answerType && msg.answerType !== 'chat' && (
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                          msg.answerType === 'guideline'
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {msg.answerType === 'guideline'
                          ? '가이드라인 기반'
                          : '일반 안내'}
                      </span>
                    )}

                    <div
                      className={cn(
                        'max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed',
                        msg.role === 'user'
                          ? 'rounded-tr-none bg-primary text-primary-foreground'
                          : 'rounded-tl-none border bg-card text-foreground shadow-sm',
                      )}
                    >
                      {msg.role === 'ai' ? (
                        <ChatMarkdown content={displayText} />
                      ) : (
                        <p className="whitespace-pre-wrap">{displayText}</p>
                      )}
                    </div>

                    {msg.role === 'ai' &&
                      msg.answerType === 'guideline' &&
                      msg.sources &&
                      msg.sources.length > 0 && (
                      <div className="max-w-[90%] space-y-2 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 dark:border-amber-900/60 dark:bg-amber-950/35">
                        <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                          가이드라인 원문
                        </p>
                        {msg.sources.map((s, idx) => (
                          <div
                            key={idx}
                            className="rounded-md border border-amber-200/60 bg-white/70 px-2.5 py-2 text-xs dark:border-amber-900/40 dark:bg-amber-950/20"
                          >
                            <p className="font-mono text-[11px] text-amber-800/80 dark:text-amber-300/80">
                              {s.fileName}
                              <span className="mx-1">·</span>p.{s.page}
                            </p>
                            <p className="mt-1 leading-relaxed text-amber-950/90 dark:text-amber-50/90">
                              {s.excerpt}
                            </p>
                          </div>
                        ))}
                      </div>
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
                  variant={chat.guideMode === value ? 'default' : 'outline'}
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
                disabled={!aiReady || !chat.dataReady}
              />
              <Button type="submit" disabled={disabled} size="icon" aria-label="전송">
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
