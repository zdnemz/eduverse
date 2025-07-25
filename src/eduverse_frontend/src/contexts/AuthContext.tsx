import * as React from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { useNavigate } from 'react-router-dom';
import Modal from '@/components/ui/modal';
import { Identity } from '@dfinity/agent';
import { HttpAgent, Actor } from '@dfinity/agent';
import {
  idlFactory as backendIdl,
  canisterId as backendCanisterId,
} from '../../../declarations/eduverse_backend';

interface User {
  name: string;
  email?: string;
  completedCourses: Array<string>;
}

interface AuthContextType {
  isAuthenticated: boolean;
  principal: string | null;
  identity: Identity | null;
  userData: User | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode | React.ReactNode[];
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [principal, setPrincipal] = React.useState<string | null>(null);
  const [identity, setIdentity] = React.useState<Identity | null>(null);
  const [authClient, setAuthClient] = React.useState<AuthClient | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [userData, setUserData] = React.useState<User | null>(null);
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  const navigate = useNavigate();
  const isLocal = window.location.hostname === 'localhost';

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

    setIdentity(identity);
    setPrincipal(principalId);
    setIsAuthenticated(true);
    setLoading(false);
  }

  async function login() {
    if (!authClient) return;

    await authClient.logout();
    setLoading(true);

    await authClient.login({
      identityProvider:
        process.env.DFX_NETWORK === 'local'
          ? `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`
          : 'https://identity.ic0.app/#authorize',
      onSuccess: async () => {
        if (!authClient) return;

        await handleLogin(authClient);

        const identity = authClient.getIdentity();
        const authedAgent = new HttpAgent({
          identity,
          host: isLocal ? 'http://127.0.0.1:4943' : 'https://icp0.io',
        });

        if (isLocal) {
          await authedAgent.fetchRootKey();
        }

        const authedBackendActor = Actor.createActor(backendIdl, {
          agent: authedAgent,
          canisterId: backendCanisterId,
        });

        const user = await authedBackendActor.getMyProfile();

        function isUser(obj: any): obj is User {
          return (
            obj &&
            typeof obj === 'object' &&
            typeof obj.name === 'string' &&
            Array.isArray(obj.completedCourses)
          );
        }

        if (isUser(user)) {
          setUserData(user);
        } else {
          setUserData(null);
        }

        navigate('/dashboard');
        setLoading(false);
      },
    });
  }

  async function logout() {
    setShowLogoutModal(true);
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        identity,
        principal,
        login,
        logout,
        loading,
        userData,
      }}
    >
      {children}

      <Modal
        state={[showLogoutModal, setShowLogoutModal]}
        message="Yes, Logout"
        handle={async () => {
          if (!authClient) return;
          await authClient.logout();
          setIsAuthenticated(false);
          setPrincipal(null);
          setUserData(null);
          navigate('/');
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
