import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/libs/utils';
import * as React from 'react';
import Loading from '../Loading';
import { Navigate } from 'react-router-dom';

export interface RootLayoutProps {
  children: React.ReactNode | React.ReactNode[];
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  background?: React.ReactNode;
  protected?: boolean;
}

const DEFAULT_PADDING = '*:px-6 *:sm:px-12 *:md:px-24 *:lg:px-36 *:xl:px-48 *:2xl:px-60';

export default function RootLayout({
  children,
  className,
  header,
  footer,
  background,
  protected: isProtected = false,
}: RootLayoutProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Loading />;

  if (isProtected) {
    if (!isAuthenticated) return <Navigate to="/" replace />;
  }

  return (
    <>
      {header && <header className={cn('fixed z-50 w-full', DEFAULT_PADDING)}>{header}</header>}
      <main className={cn('relative *:py-12', className, DEFAULT_PADDING)}>
        {children}
        {background}
      </main>
      {footer && <footer className={cn(DEFAULT_PADDING)}>{footer}</footer>}
    </>
  );
}
