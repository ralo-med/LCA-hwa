import { useEffect, useRef, type FormEvent } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import type { ChatMessage } from '../types';

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
    <div className="bg-gradient-to-br from-slate-50 to-indigo-50/50 border-2 border-indigo-100 rounded-3xl p-6 no-print shadow-sm">
      <h3 className="font-extrabold text-slate-800 flex items-center gap-2 mb-4">
        <MessageSquare size={20} className="text-blue-600" />
        ✨ 전문의 실시간 Q&amp;A 챗봇
      </h3>

      <div className="bg-white rounded-2xl border border-slate-200 h-56 overflow-y-auto p-4 space-y-4 mb-3 custom-scrollbar shadow-inner">
        {history.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-10 font-medium">
            리포트와 소견에 대해 추가적으로 궁금하신 점을 물어보세요. (예: 약물 부작용 관리법, 음식 주의사항 등)
          </p>
        )}
        {history.map((c, i) => (
          <div key={i} className={`flex ${c.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`p-3 rounded-2xl text-sm leading-relaxed ${
                c.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none font-bold'
                  : 'bg-slate-100 text-slate-800 rounded-tl-none font-medium shadow-sm'
              }`}
            >
              {c.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="질문을 구체적으로 기입해 주세요..."
          className="flex-1 bg-white border border-slate-300 rounded-2xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
        />
        <button
          type="submit"
          disabled={isChatting || !input.trim()}
          className="bg-blue-600 text-white px-5 rounded-2xl hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition-all shadow-md"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
