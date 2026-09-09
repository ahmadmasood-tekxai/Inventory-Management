import type { ReactNode } from 'react';

import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

export function DashboardLayout({ pageTitle, children }: { pageTitle: string; children: ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header pageTitle={pageTitle} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
          <div className="">{children}</div>
        </main>
      </div>
    </div>
  );
}
