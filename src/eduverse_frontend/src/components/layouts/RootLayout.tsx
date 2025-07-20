import { cn } from '@/libs/utils';
import * as React from 'react';

export interface RootLayoutProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

const DEFAULT_PADDING = '*:px-6 *:sm:px-12 *:md:px-24 *:lg:px-36 *:xl:px-48 *:2xl:px-60';

export default function RootLayout({ children, className, header, footer }: RootLayoutProps) {
  return (
    <>
      <header className={cn('fixed z-50 w-full', DEFAULT_PADDING)}>{header}</header>
      <main className={cn('*:py-12', className, DEFAULT_PADDING)}>{children}</main>
      <footer className={cn(DEFAULT_PADDING)}>{footer}</footer>
    </>
  );
}
