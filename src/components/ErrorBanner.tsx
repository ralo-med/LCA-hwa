import { AlertCircle } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
}

const ErrorBanner = ({ message }: ErrorBannerProps) => (
  <div className="no-print mb-6 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
    <AlertCircle className="h-4 w-4 shrink-0" />
    {message}
  </div>
);

export default ErrorBanner;
