import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ user, children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-lias-bg text-lias-ink">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} />
        <main className="flex-1 px-8 pt-7 pb-10 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
