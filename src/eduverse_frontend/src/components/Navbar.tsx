'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/libs/utils';
import { useScroll } from 'framer-motion';
import InternetComputer from '@/assets/icons/InternetComputer';
import EduVerse from '@/assets/icons/EduVerse';

export default function Navbar() {
  const { scrollYProgress } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => {
      setScrolled(v !== 0);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 z-50 flex w-full items-center justify-between px-6 py-3 transition-all duration-300 md:px-12',
        scrolled && 'border-base-content/30 bg-base-200/80 border-b shadow-sm backdrop-blur-md'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <EduVerse color="oklch(90% 0.058 230.902)" className="h-6 w-6" />
        <h1 className="text-2xl font-bold">EduVerse</h1>
      </div>

      {/* Nav Button */}
      <button className="btn btn-accent flex items-center gap-2 rounded-lg shadow-md">
        <InternetComputer className="h-6 w-6" />
        <span className="font-semibold">Sign In with II</span>
      </button>
    </header>
  );
}
