// hooks/useAuth.tsx
import * as React from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { useNavigate } from 'react-router-dom';
import Modal from '@/components/ui/modal';

interface AuthContextType {
  isAuthenticated: boolean;
  principal: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode | React.ReactNode[];
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);
  const [principal, setPrincipal] = React.useState<string | null>(null);
  const [authClient, setAuthClient] = React.useState<AuthClient | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [showLogoutModal, setShowLogoutModal] = React.useState<boolean>(false);

  const navigate = useNavigate();

  React.useEffect(() => {
    (async () => {
      const client = await AuthClient.create();
      setAuthClient(client);

      if (await client.isAuthenticated()) {
        await handleLogin(client);
      } else {
        setLoading(false);
      }
    })();
  }, []);

  async function handleLogin(client: AuthClient) {
    const identity = client.getIdentity();
    const principalId = identity.getPrincipal().toText();
    setPrincipal(principalId);
    setIsAuthenticated(true);
    setLoading(false);

    navigate('/dashboard');
  }

  async function login() {
    if (!authClient) return;
    await authClient.login({
      identityProvider:
        process.env.DFX_NETWORK === 'local'
          ? `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`
          : 'https://identity.ic0.app/#authorize',
      onSuccess: async () => {
        if (authClient) {
          await handleLogin(authClient);
        }
      },
    });
  }

  async function logout() {
    setShowLogoutModal(true);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, principal, login, logout, loading }}>
      {children}
      <Modal
        state={[showLogoutModal, setShowLogoutModal]}
        message="Yes, Logout"
        handle={async () => {
          if (!authClient) return;
          await authClient.logout();
          setIsAuthenticated(false);
          setPrincipal(null);
        }}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
