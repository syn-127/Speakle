import { cn } from '@/lib/utils';

interface LogoMarkProps {
  className?: string;
}

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn('text-primary', className)} aria-hidden="true">
      <rect x="4" y="4" width="40" height="28" rx="14" fill="currentColor" />
      <path d="M14 30 L9 43 L24 30 Z" fill="currentColor" />
      <path
        d="M24 6 L26.83 14.17 L35 17 L26.83 19.83 L24 28 L21.17 19.83 L13 17 L21.17 14.17 Z"
        fill="white"
      />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

export function Logo({ className, iconClassName, textClassName }: LogoProps) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <LogoMark className={cn('h-7 w-7', iconClassName)} />
      <span className={cn('text-xl font-bold tracking-tight', textClassName)}>Speakle</span>
    </span>
  );
}
