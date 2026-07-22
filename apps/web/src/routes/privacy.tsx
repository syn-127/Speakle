import { createFileRoute, Link } from '@tanstack/react-router';
import { Logo } from '@/components/Logo';
import { useConsentStore } from '@/store/consent.store';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/privacy')({
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  const status = useConsentStore((s) => s.status);
  const reset = useConsentStore((s) => s.reset);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/"><Logo /></Link>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl space-y-4 px-4 py-12">
        <h1 className="text-3xl font-bold">Privacy &amp; Cookie Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: 2026</p>

        <h2 className="pt-4 text-xl font-semibold">Cookies &amp; similar technologies</h2>
        <p>
          We only use one optional category of cookies: analytics, to understand how visitors use this
          site (pages viewed, approximate location, device type). These are set by Google Analytics and are
          <strong> not loaded until you accept them</strong> in the cookie banner shown on your first visit.
        </p>
        <p>
          We do not use advertising, cross-site tracking, or third-party marketing cookies. We do not sell
          or share personal information with third parties for monetary or other valuable consideration.
        </p>
        <p>
          Strictly necessary items (such as your login session and your cookie preference itself) are
          stored locally in your browser and are required for the site to function; these are not affected
          by the choice below.
        </p>

        <h2 className="pt-4 text-xl font-semibold">Your choice</h2>
        <p>Current analytics preference: <strong>{status === 'pending' ? 'not yet decided' : status}</strong>.</p>
        <Button size="sm" onClick={reset}>Change cookie preference</Button>

        <h2 className="pt-4 text-xl font-semibold">Your rights</h2>
        <p>
          Depending on where you live (including under the EU/UK GDPR and the California Consumer Privacy
          Act), you may have the right to access, delete, or export data associated with you, and to
          withdraw analytics consent at any time using the control above. To make a request, contact the
          site owner using the details on the homepage.
        </p>

        <h2 className="pt-4 text-xl font-semibold">Data we collect directly</h2>
        <p>
          Blog comments and admin accounts (if enabled) store the information you directly submit, such as
          a name and email address, solely to operate those features.
        </p>
      </main>
    </div>
  );
}
