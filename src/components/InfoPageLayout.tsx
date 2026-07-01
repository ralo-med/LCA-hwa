import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface InfoPageLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function InfoPageLayout({ title, children }: InfoPageLayoutProps) {
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

        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h1>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90 md:text-base">
          {children}
        </div>
      </div>
    </div>
  );
}
