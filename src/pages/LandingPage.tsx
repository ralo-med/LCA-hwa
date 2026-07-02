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
    to: '/profile',
    icon: HeartHandshake,
    role: '환자·보호자',
    description: '궁금한 점을 안내 챗봇과 편하게 나눠 보세요.',
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
    <div className="relative flex flex-1 flex-col overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grain"
      >
        <div className="absolute -right-40 -top-40 h-144 w-xl rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-48 -left-24 h-120 w-120 rounded-full bg-chart-4/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl flex-1 px-5 pt-10 pb-12 md:px-8 md:pt-14 md:pb-16 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-20">
        <div className="animate-rise">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="h-px w-8 shrink-0 bg-primary/60" />
            <span className="text-pretty text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              화순전남대학교병원 · 폐암 정밀의료
            </span>
          </div>

          <h1 className="font-display mt-8 text-pretty text-4xl font-bold leading-[1.16] tracking-tight md:mt-6 md:text-5xl">
            혼자 걷지 않도록,
            <br />
            <span className="relative text-primary">
              곁에서 함께
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-1 h-3 -rotate-1 bg-primary/12"
              />
            </span>
          </h1>

          <div className="mt-12 md:mt-10">
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
                  <span className="font-display w-7 shrink-0 text-xl tabular-nums text-muted-foreground/45">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-2.5">
                    <Icon className="h-5 w-5 shrink-0 text-primary" />
                    <span className="min-w-0">
                      <span className="block text-lg font-bold leading-tight">
                        {item.role}
                      </span>
                      <span className="mt-0.5 block text-pretty text-sm text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground/50 transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              );
            })}
          </div>
        </div>

        <div
          className="animate-rise relative hidden lg:block lg:order-last"
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

      {/* 모바일: 푸터 바로 위 */}
      <div className="mt-auto lg:hidden">
        <img
          src="/images/care.png"
          alt="환자 곁에서 함께하는 보호자 일러스트"
          className="aspect-4/3 w-full object-cover"
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default LandingPage;
