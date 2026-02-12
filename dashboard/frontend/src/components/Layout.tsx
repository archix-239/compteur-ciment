import { Sidebar } from './Sidebar';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  activeRoute?: string;
}

export default function Layout({ children, activeRoute }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar activeRoute={activeRoute} />
      <div className="flex-1 ml-72">
        {children}
      </div>
    </div>
  );
}
