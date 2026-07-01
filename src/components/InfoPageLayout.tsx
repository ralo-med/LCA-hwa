import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface InfoPageLayoutProps {
  title: string;
  subtitle?: string;
  image?: string;
  children: React.ReactNode;
}

export function InfoPageLayout({
  title,
  subtitle,
  image,
  children,
}: InfoPageLayoutProps) {
  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto max-w-3xl p-4 pb-8 md:p-8">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          홈으로
        </Link>

        <div className="animate-rise-delay-1">
          <div className="flex items-center gap-4">
            <span className="h-px w-8 bg-primary/60" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              화순전남대학교병원
            </span>
          </div>

          <h1 className="font-display mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-pretty text-base text-muted-foreground">
              {subtitle}
            </p>
          )}

          {image && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-border/60 shadow-sm">
              <img
                src={image}
                alt=""
                aria-hidden
                className="aspect-16/7 w-full object-cover"
              />
            </div>
          )}
        </div>

        <div className="animate-rise-delay-2 mt-8 space-y-8 text-sm leading-relaxed text-foreground/90 md:text-base">
          {children}
        </div>
      </div>
    </div>
  );
}
