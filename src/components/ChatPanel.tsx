import { type FormEvent, useEffect, useRef } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import type { ChatMessage } from '@/types';

interface ChatPanelProps {
  history: ChatMessage[];
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  isChatting: boolean;
}

const ChatPanel = ({ history, input, setInput, onSend, isChatting }: ChatPanelProps) => {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSend();
  };

  return (
    <Card className="no-print">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-5 w-5 text-primary" />
          전문의 실시간 Q&amp;A 챗봇
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="custom-scrollbar h-56 space-y-3 overflow-y-auto rounded-lg border bg-muted/30 p-4">
          {history.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              리포트와 소견에 대해 추가로 궁금하신 점을 물어보세요.
              <br />
              (예: 약물 부작용 관리법, 음식 주의사항 등)
            </p>
          )}
          {history.map((c, i) => (
            <div key={i} className={cn('flex', c.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed',
                  c.role === 'user'
                    ? 'rounded-tr-none bg-primary text-primary-foreground'
                    : 'rounded-tl-none border bg-background text-foreground',
                )}
              >
                {c.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="질문을 구체적으로 기입해 주세요..."
          />
          <Button type="submit" disabled={isChatting || !input.trim()} size="icon" aria-label="전송">
            <Send />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChatPanel;
