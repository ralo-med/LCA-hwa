import { ArrowRight, BookOpen, HeartHandshake, Stethoscope, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RoleCard {
  to: string;
  icon: typeof User;
  role: string;
  title: string;
  description: string;
  accent: 'patient' | 'guardian' | 'staff';
}

const ROLE_CARDS: RoleCard[] = [
  {
    to: '/guide-chat',
    icon: User,
    role: '저는 환자입니다',
    title: '궁금한 점을 편하게 물어보세요',
    description:
      '내 상태에 맞춰 치료·부작용·일상생활을 쉽게 설명해 드려요. 어렵게 느껴지면 편하게 말 걸어 주세요.',
    accent: 'patient',
  },
  {
    to: '/guide-chat',
    icon: HeartHandshake,
    role: '저는 보호자입니다',
    title: '가족을 돕기 위한 정보를 찾아보세요',
    description:
      '환자분을 어떻게 도우면 좋을지, 무엇을 준비하면 좋을지 함께 정리해 드려요.',
    accent: 'guardian',
  },
  {
    to: '/dashboard',
    icon: Stethoscope,
    role: '저는 의료진입니다',
    title: '정밀의료 생존 분석 대시보드',
    description:
      '조직형·바이오마커별 Kaplan–Meier 생존 분석과 가이드라인 근거를 확인하세요.',
    accent: 'staff',
  },
];

const ACCENT_CLASS: Record<RoleCard['accent'], string> = {
  patient:
    'border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10',
  guardian:
    'border-sky-300/50 bg-sky-50/60 hover:border-sky-400 hover:bg-sky-100/70 dark:border-sky-900/50 dark:bg-sky-950/20 dark:hover:bg-sky-950/40',
  staff:
    'border-border bg-muted/40 hover:border-foreground/30 hover:bg-muted/70',
};

const ICON_CLASS: Record<RoleCard['accent'], string> = {
  patient: 'bg-primary/15 text-primary',
  guardian: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
  staff: 'bg-background text-foreground',
};

const LandingPage = () => {
  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-10 md:py-16">
        <div className="text-center">
          <img
            src="/logo.png"
            alt="화순전남대학교병원"
            width={64}
            height={64}
            className="mx-auto h-16 w-16 object-contain"
          />
          <h1 className="mt-5 text-2xl font-bold tracking-tight md:text-4xl">
            폐암 환자 케어 플랫폼
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            어떤 분이신가요? 아래에서 선택하시면 딱 맞는 화면으로 안내해
            드릴게요.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {ROLE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.role}
                to={card.to}
                className={`group flex min-h-[44px] flex-col rounded-2xl border-2 p-6 text-left transition-colors ${ACCENT_CLASS[card.accent]}`}
              >
                <span
                  className={`inline-flex h-14 w-14 items-center justify-center rounded-xl ${ICON_CLASS[card.accent]}`}
                >
                  <Icon className="h-7 w-7" />
                </span>
                <h2 className="mt-5 text-lg font-bold md:text-xl">
                  {card.role}
                </h2>
                <p className="mt-1 text-base font-medium text-foreground/90">
                  {card.title}
                </p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {card.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-base font-semibold text-primary">
                  시작하기
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-center">
          <Link
            to="/guides"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <BookOpen className="h-4 w-4" />
            가이드라인 PDF 보기
          </Link>
          <Link
            to="/about"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            서비스 소개
          </Link>
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground">
          본 플랫폼의 모든 정보는 AI 정밀의료 보조 자료이며, 실제 진료 계획은
          담당 전문의의 소견을 우선합니다.
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
