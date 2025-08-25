import { getAuthClient } from '@/lib/authClient';
import { useActor, useAuthStore, useIsAuthenticated, usePrincipal } from '@/stores/auth-store';
import { actor as createActor } from '@/lib/actor';
import * as React from 'react';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const actor = useActor();
  const isAuthenticated = useIsAuthenticated();
  const principal = usePrincipal();

  React.useEffect(() => {
    const init = async () => {
      if (isAuthenticated && principal && !actor) {
        try {
          const client = await getAuthClient();
          const identity = client.getIdentity();

          if (identity && identity.getPrincipal().toText() === principal) {
            const newActor = await createActor(identity);

            useAuthStore.setState({
              actor: newActor,
            });

            console.log('Actor initialized on refresh');
          }
        } catch (err) {
          console.error('Error reinitializing actor:', err);
        }
      }
    };

    init();
  }, [isAuthenticated, principal, actor]);

  return <>{children}</>;
}
