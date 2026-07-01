import { Check, Share2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button, type ButtonProps } from '@/components/ui/button';
import { shareContent, type SharePayload } from '@/lib/share';

interface ShareButtonProps {
  payload: SharePayload;
  label?: string;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
}

export function ShareButton({
  payload,
  label = '공유',
  variant = 'outline',
  size = 'sm',
  className,
}: ShareButtonProps) {
  const [done, setDone] = useState(false);

  const handleShare = async () => {
    const result = await shareContent(payload);
    if (result === 'copied') {
      toast.success('내용을 복사했어요. 카톡·문자에 붙여넣어 보내세요.');
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } else if (result === 'shared') {
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } else if (result === 'failed') {
      toast.error('공유에 실패했어요. 잠시 후 다시 시도해 주세요.');
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleShare}
      aria-label={`${label} 하기`}
    >
      {done ? (
        <Check className="h-4 w-4 text-primary" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
      {label}
    </Button>
  );
}
