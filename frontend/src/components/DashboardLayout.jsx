import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ user, avatarUrl, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-lias-bg text-lias-ink">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        user={user}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} avatarUrl={avatarUrl} onToggleSidebar={() => setMobileOpen((o) => !o)} />
        {/* Content is width-capped so tables and forms stay readable on wide displays. */}
        <main className="flex-1 px-5 sm:px-7 lg:px-8 pt-7 pb-12">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
