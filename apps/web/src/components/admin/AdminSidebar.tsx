import { Link, useRouterState } from '@tanstack/react-router';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Tag,
  Image,
  Palette,
  Puzzle,
  Settings,
  Globe,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/posts', label: 'Posts', icon: FileText },
  { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
  { href: '/admin/tags', label: 'Tags', icon: Tag },
  { href: '/admin/media', label: 'Media', icon: Image },
  { href: '/admin/comments', label: 'Comments', icon: MessageSquare },
  { href: '/admin/themes', label: 'Themes', icon: Palette },
  { href: '/admin/plugins', label: 'Plugins', icon: Puzzle },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const router = useRouterState();
  const pathname = router.location.pathname;

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Logo />
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t p-4">
        <Link
          to="/blog"
          target="_blank"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Globe className="h-3 w-3" />
          View Blog
        </Link>
      </div>
    </aside>
  );
}
