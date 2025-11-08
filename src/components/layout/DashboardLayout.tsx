import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-dashboard">
      {/* 🧭 Fixed Sidebar */}
      <aside className="w-64 fixed top-0 left-0 h-screen bg-sidebar border-r border-gray-800">
        <Sidebar />
      </aside>

      {/* 📜 Right Section */}
      <div className="flex-1 flex flex-col ml-64 h-screen overflow-hidden relative">
        {/* 🧢 Fixed Header */}
        <div className="fixed top-0 left-64 right-0 z-50 bg-background border-b border-gray-800">
          <Header />
        </div>

        {/* 📄 Scrollable main content */}
        <main className="flex-1 overflow-y-auto p-6 mt-[72px]">
          {children}
        </main>
      </div>
    </div>
  );
};
