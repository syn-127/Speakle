import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Analytics } from '@/components/shared/Analytics';
import { CookieConsentBanner } from '@/components/shared/CookieConsentBanner';

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <Outlet />
      <Toaster />
      <Analytics />
      <CookieConsentBanner />
    </>
  ),
});
