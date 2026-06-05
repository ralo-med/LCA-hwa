import { BookOpen, ExternalLink, FileText, LayoutDashboard, Stethoscope } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/cn';

const DOCTORS_URL =
  'https://www.cnuhh.com/medical/info/dept.cs?act=view&mode=doctorList&deptCd=IMP';

type NavItem =
  | {
      kind: 'internal';
      to: string;
      label: string;
      shortLabel: string;
      icon: typeof LayoutDashboard;
      end?: boolean;
    }
  | {
      kind: 'external';
      href: string;
      label: string;
      shortLabel: string;
      icon: typeof Stethoscope;
    };

const NAV_ITEMS: NavItem[] = [
  {
    kind: 'internal',
    to: '/',
    label: '생존 대시보드',
    shortLabel: '대시보드',
    icon: LayoutDashboard,
    end: true,
  },
  {
    kind: 'internal',
    to: '/guide-chat',
    label: '환자 안내 챗봇',
    shortLabel: '환자 챗봇',
    icon: BookOpen,
  },
  {
    kind: 'internal',
    to: '/guides',
    label: '가이드라인 PDF',
    shortLabel: 'PDF',
    icon: FileText,
  },
  {
    kind: 'external',
    href: DOCTORS_URL,
    label: '폐암 의료진',
    shortLabel: '의료진',
    icon: Stethoscope,
  },
];

const linkClass = (isActive: boolean, disabled?: boolean) =>
  cn(
    'inline-flex min-w-[calc(50%-0.125rem)] flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2.5 text-sm font-medium transition-colors sm:min-w-0 sm:flex-initial sm:gap-2 sm:px-3',
    isActive
      ? 'bg-background text-foreground shadow-sm'
      : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
    disabled && 'pointer-events-none opacity-50',
  );

const AppNav = () => {
  return (
    <header className="no-print shrink-0 border-b bg-card pt-[env(safe-area-inset-top,0px)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:px-8">
        <div className="flex items-center justify-between gap-4">
          <NavLink
            to="/"
            className="flex min-w-0 items-center gap-3 rounded-lg transition-opacity hover:opacity-90"
          >
            <img
              src="/logo.png"
              alt="화순전남대학교병원"
              width={48}
              height={48}
              className="h-11 w-11 shrink-0 object-contain md:h-12 md:w-12"
            />
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight text-foreground md:text-base">
                화순전남대학교병원
              </p>
              <p className="text-xs text-muted-foreground">
                폐암 환자 케어 플랫폼
              </p>
            </div>
          </NavLink>
          <ThemeToggle />
        </div>

        <nav
          className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1"
          aria-label="주요 메뉴"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            if (item.kind === 'external') {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass(false)}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="sm:hidden">{item.shortLabel}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                </a>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => linkClass(isActive)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="sm:hidden">{item.shortLabel}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default AppNav;
