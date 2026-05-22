import { AlertCircle } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
}

const ErrorBanner = ({ message }: ErrorBannerProps) => (
  <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-center gap-2 no-print">
    <AlertCircle size={18} /> {message}
  </div>
);

export default ErrorBanner;
