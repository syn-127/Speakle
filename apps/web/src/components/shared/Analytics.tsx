import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useConsentStore } from '@/store/consent.store';

const SCRIPT_ID = 'ga-gtag-script';

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// Best-effort cleanup of GA cookies for a rejected/revoked consent.
function purgeAnalyticsCookies() {
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0]?.trim();
    if (name && (name === '_ga' || name.startsWith('_ga_') || name.startsWith('_gid'))) {
      deleteCookie(name);
    }
  });
}

export function Analytics() {
  const status = useConsentStore((s) => s.status);

  const { data } = useQuery({
    queryKey: ['site-config'],
    queryFn: () => api.get<{ showHomepage: boolean; googleAnalyticsId: string | null }>('/blog/site-config'),
    staleTime: Infinity,
  });

  const gaId = data?.googleAnalyticsId ?? null;

  useEffect(() => {
    if (!gaId) return;

    if (status !== 'accepted') {
      // No consent (yet) or consent revoked: make sure nothing is loaded, and disable
      // any hits from a script that was already injected earlier in this session.
      (window as unknown as Record<string, boolean>)[`ga-disable-${gaId}`] = true;
      document.getElementById(SCRIPT_ID)?.remove();
      purgeAnalyticsCookies();
      return;
    }

    (window as unknown as Record<string, boolean>)[`ga-disable-${gaId}`] = false;

    if (document.getElementById(SCRIPT_ID)) return;

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    document.head.appendChild(script);

    const win = window as unknown as { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
    win.dataLayer = win.dataLayer ?? [];
    win.gtag = function gtag(...args: unknown[]) {
      win.dataLayer?.push(args);
    };
    win.gtag('js', new Date());
    win.gtag('config', gaId, { anonymize_ip: true });
  }, [gaId, status]);

  return null;
}
