import { ArrowRight, HeartHandshake, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RoleItem {
  to: string;
  icon: typeof HeartHandshake;
  role: string;
  description: string;
}

const ROLE_ITEMS: RoleItem[] = [
  {
    to: '/guide-chat',
    icon: HeartHandshake,
    role: '환자·보호자',
    description: '치료·부작용·일상을 쉽게 안내해 드려요.',
  },
  {
    to: '/dashboard',
    icon: Stethoscope,
    role: '의료진',
    description: '생존 분석 대시보드로 이동합니다.',
  },
];

const LandingPage = () => {
  return (
    <div className="relative overflow-hidden bg-background text-foreground">
      {/* 배경: 은은한 컬러 메시 + 종이 질감 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grain"
      >
        <div className="absolute -right-32 -top-40 h-[38rem] w-[38rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-48 -left-24 h-[32rem] w-[32rem] rounded-full bg-chart-4/10 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-12 lg:gap-16">
        {/* 왼쪽: 에디토리얼 헤드라인 */}
        <div className="animate-rise lg:col-span-6 lg:pt-6">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-primary/60" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              화순전남대학교병원 · 폐암 정밀의료
            </span>
          </div>

          <h1 className="font-display mt-8 text-pretty text-5xl font-bold leading-[1.16] tracking-tight md:text-6xl lg:text-[4rem]">
            혼자 걷지 않도록,
            <br />
            <span className="relative whitespace-nowrap text-primary">
              곁에서 함께
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-1 h-3 -rotate-1 bg-primary/12"
              />
            </span>
          </h1>
        </div>

        {/* 오른쪽: 번호가 매겨진 역할 선택 리스트 */}
        <div className="animate-rise lg:col-span-6 lg:pl-6" style={{ animationDelay: '0.08s' }}>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            어떤 분이신가요?
          </p>
          <div>
            {ROLE_ITEMS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.role}
                  to={item.to}
                  className="group relative flex items-center gap-5 border-t border-border/70 py-6 transition-colors last:border-b hover:bg-foreground/[0.025]"
                >
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-0 w-0.5 -translate-y-1/2 bg-primary transition-all duration-300 group-hover:h-10"
                  />
                  <span className="font-display w-8 text-2xl tabular-nums text-muted-foreground/45">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center gap-2 text-lg font-bold">
                      <Icon className="h-5 w-5 text-primary" />
                      {item.role}
                    </span>
                    <span className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground/50 transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link
              to="/guides"
              className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              가이드라인 PDF 보기
            </Link>
            <Link
              to="/about"
              className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              서비스 소개
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 pb-12 md:px-8">
        <p className="border-t border-border/60 pt-6 text-xs text-muted-foreground/80">
          AI 보조 정보이며, 실제 진료는 담당 전문의와 상의하세요.
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
