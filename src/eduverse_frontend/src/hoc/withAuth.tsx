import { Link, Navigate } from 'react-router-dom';
import { ChevronLeftCircle } from 'lucide-react';

import RootLayout from '@/components/layouts/RootLayout';
import { useIsAuthenticated } from '@/stores/auth-store';

export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string | null = '/'
) => {
  return function AuthenticatedComponent(props: P) {
    const isAuthenticated = useIsAuthenticated();

    if (!isAuthenticated) {
      if (!redirectTo) {
        return (
          <RootLayout>
            <div className="flex min-h-screen w-full flex-col items-center justify-center space-y-3 text-center">
              <div>
                <h1 className="text-primary text-6xl font-bold">401</h1>
                <h2 className="text-2xl font-semibold">Tidak Memiliki Akses</h2>
                <p className="text-muted-foreground max-w-md text-sm">
                  {"Sorry, u don't have any permission to access this page."}
                </p>
              </div>
              <Link className="btn btn-primary" to="/">
                <ChevronLeftCircle className="h-4 w-4" />
                Back to Home
              </Link>
            </div>
          </RootLayout>
        );
      } else {
        return <Navigate to={redirectTo} replace />;
      }
    }

    return <Component {...props} />;
  };
};
