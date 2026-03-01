'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  History,
  Brain,
  Zap,
  Clock,
  Shield,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/sessions', label: 'Sessions', icon: History },
  { href: '/memory', label: 'Memory', icon: Brain },
  { href: '/skills', label: 'Skills', icon: Zap },
  { href: '/cron', label: 'Cron Jobs', icon: Clock },
  { href: '/audit', label: 'Audit Log', icon: Shield },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-gray-800 bg-gray-950">
      <div className="flex items-center gap-2 px-5 py-4">
        <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
          CF
        </div>
        <span className="text-lg font-bold">ClawFree</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${active ? 'active' : ''}`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-800 p-3">
        <button onClick={handleSignOut} className="sidebar-link w-full">
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
