import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useConsentStore } from '@/store/consent.store';

export function CookieConsentBanner() {
  const status = useConsentStore((s) => s.status);
  const accept = useConsentStore((s) => s.accept);
  const reject = useConsentStore((s) => s.reject);

  if (status !== 'pending') return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <div className="container mx-auto flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use cookies only to understand site usage. Nothing is loaded or stored until you accept. See our{' '}
          <Link to="/privacy" className="underline hover:text-foreground">
            Privacy &amp; Cookie Policy
          </Link>{' '}
          for details.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={reject}>
            Reject
          </Button>
          <Button size="sm" onClick={accept}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CookiePreferencesLink({ className }: { className?: string }) {
  const status = useConsentStore((s) => s.status);
  const reset = useConsentStore((s) => s.reset);

  if (status === 'pending') return null;

  return (
    <button type="button" onClick={reset} className={className ?? 'hover:text-foreground'}>
      Cookie Settings
    </button>
  );
}
