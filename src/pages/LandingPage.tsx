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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grain"
      >
        <div className="absolute -right-40 -top-40 h-144 w-xl rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-48 -left-24 h-120 w-120 rounded-full bg-chart-4/10 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:px-8 md:py-20 lg:grid-cols-2 lg:gap-16">
        {/* 왼쪽: 헤드라인 + 역할 선택 */}
        <div className="animate-rise">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-primary/60" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              화순전남대학교병원 · 폐암 정밀의료
            </span>
          </div>

          <h1 className="font-display mt-6 text-pretty text-4xl font-bold leading-[1.16] tracking-tight md:text-5xl">
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

          <div className="mt-10">
            {ROLE_ITEMS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.role}
                  to={item.to}
                  className="group relative flex items-center gap-4 border-t border-border/70 py-5 pl-6 pr-5 transition-colors last:border-b hover:bg-foreground/2.5"
                >
                  <span
                    aria-hidden
                    className="absolute inset-y-2 left-0 w-1 origin-center scale-y-0 rounded-full bg-primary transition-transform duration-300 group-hover:scale-y-100"
                  />
                  <span className="font-display w-7 text-xl tabular-nums text-muted-foreground/45">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-5 w-5 text-primary" />
                    <span>
                      <span className="block text-lg font-bold leading-tight">
                        {item.role}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                  </span>
                  <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-muted-foreground/50 transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link
              to="/guides"
              className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              가이드라인 PDF
            </Link>
            <Link
              to="/about"
              className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              서비스 소개
            </Link>
          </div>
        </div>

        {/* 오른쪽: 브랜드 일러스트 */}
        <div
          className="animate-rise relative order-first lg:order-last"
          style={{ animationDelay: '0.08s' }}
        >
          <div className="overflow-hidden rounded-[1.75rem] border border-border/60 shadow-sm">
            <img
              src="/images/care.png"
              alt="환자 곁에서 함께하는 보호자 일러스트"
              className="aspect-4/3 w-full object-cover"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
