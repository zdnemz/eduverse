import { create } from "zustand";
import { actor as createActor } from "@/lib/actor";
import { ActorSubclass } from "@dfinity/agent";
import { _SERVICE } from "declarations/eduverse_backend/eduverse_backend.did";
import { getAuthClient } from "@/lib/authClient";
import { Declaration } from "@/types";
import { getUser } from "@/services/auth-service";
import { persist } from "zustand/middleware";

type AuthStore = {
  isAuthenticated: boolean;
  principal: string | null;
  actor: ActorSubclass<_SERVICE> | null;
  user: Declaration.User | null;
  setUser: (user: Declaration.User) => void
  login: () => Promise<{
    success: boolean;
    newUser: boolean;
    error: string | undefined;
  }>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      principal: null,
      actor: null,
      user: null,

      login: async () => {
        try {
          const client = await getAuthClient();
          try {
            await client.logout(); // clear session
          } catch { }

          return new Promise((resolve, reject) => {
            client.login({
              identityProvider:
                process.env.DFX_NETWORK === 'local'
                  ? `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`
                  : 'https://identity.ic0.app/#authorize',
              maxTimeToLive: BigInt(7 * 24 * 3600 * 1_000_000_000), // 7 hari

              onSuccess: async () => {
                try {
                  const identity = client.getIdentity();
                  const principal = identity.getPrincipal().toText();
                  const actor = await createActor(identity);
                  const user = await getUser(actor);

                  set({
                    isAuthenticated: true,
                    principal,
                    actor: null, // actor tidak bisa dipersist
                    user,
                  });

                  resolve({
                    success: true,
                    newUser: !user,
                    error: undefined,
                  });

                } catch (err) {
                  console.error('Login success handler error:', err);
                  reject(err);
                }
              },

              onError: (err) => {
                console.error('Login error:', err);
                reject(err);
              },
            });
          });
        } catch (err) {
          console.error('Login initialization error:', err);
          return {
            success: false,
            newUser: false,
            error: err instanceof Error ? err.message : 'Something went wrong!',
          };
        }
      },

      logout: async () => {
        try {
          const client = await getAuthClient();
          await client.logout();

          set({
            isAuthenticated: false,
            principal: null,
            actor: null,
            user: null,
          });
        } catch (error) {
          console.error("Logout error:", error);
          throw error;
        }
      },
      setUser: (user) => {
        set({
          user
        })
      },
    }),

    {
      name: "auth-storage",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        principal: state.principal,
        user: state.user,
      }),
    }
  )
);


export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const usePrincipal = () => useAuthStore((s) => s.principal);
export const useActor = () => useAuthStore((s) => s.actor);
export const useAuthUser = () => useAuthStore((s) => s.user)

export const useAuthActions = () => {
  const { login, logout, setUser } = useAuthStore();
  return { login, logout, setUser };
};
