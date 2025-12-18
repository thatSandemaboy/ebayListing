import { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground relative">
      <div className="relative z-10 flex flex-col h-screen overflow-hidden">
        {children}
      </div>
    </div>
  );
}
