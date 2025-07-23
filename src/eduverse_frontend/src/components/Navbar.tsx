import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useScroll } from 'framer-motion';
import { cn } from '@/libs/utils';
import { Link } from 'react-router-dom';

import InternetComputer from '@/assets/icons/InternetComputer';
import EduVerse from '@/assets/icons/EduVerse';
import Modal from './ui/modal';

export default function Navbar() {
  const { scrollYProgress } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  const { login, logout, isAuthenticated } = useAuth();

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
      <div>
        <Link to="/" className="flex items-center gap-2">
          <EduVerse color="oklch(90% 0.058 230.902)" className="h-6 w-6" />
          <span className="text-2xl font-bold">EduVerse</span>
        </Link>
      </div>

      {/* Auth Button */}
      {!isAuthenticated ? (
        <button
          onClick={login}
          className="btn btn-accent flex items-center gap-2 rounded-lg shadow-md"
        >
          <InternetComputer className="h-6 w-6" />
          <span className="font-semibold">Get Started</span>
        </button>
      ) : (
        <button
          onClick={logout}
          className="btn btn-accent flex items-center gap-2 rounded-lg shadow-md"
        >
          <span className="font-semibold">Logout</span>
        </button>
      )}
    </header>
  );
}
