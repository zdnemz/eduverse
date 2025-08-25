import { useState, useEffect } from 'react';
import { useScroll } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

import InternetComputer from '@/assets/icons/InternetComputer';
import EduVerse from '@/assets/icons/EduVerse';
import { useIsAuthenticated } from '@/stores/auth-store';
import { LoginButton, LogoutButton } from './Auth';

export default function Navbar() {
  const { scrollYProgress } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => {
      setScrolled(v !== 0);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <>
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
        <div className="flex items-center gap-2">
          {!isAuthenticated ? (
            <LoginButton className="btn-accent flex items-center gap-2 shadow-md">
              <InternetComputer className="h-6 w-6" />
              <span className="font-semibold">Get Started</span>
            </LoginButton>
          ) : (
            <>
              <button className="btn btn-accent rounded-lg">
                <Link to={'/dashboard'}>Dashboard</Link>
              </button>
              <LogoutButton className="btn-error flex items-center gap-2 font-semibold shadow-md">
                Logout
              </LogoutButton>
            </>
          )}
        </div>
      </header>
    </>
  );
}
