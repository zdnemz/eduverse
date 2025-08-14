import { AuthClient } from '@dfinity/auth-client';

let authClient: AuthClient | null = null;

export const getAuthClient = async (): Promise<AuthClient> => {
  if (!authClient) {
    authClient = await AuthClient.create({
      idleOptions: {
        disableIdle: true,
        disableDefaultIdleCallback: true,
      },
    });

    if (process.env.NODE_ENV === 'development') {
      await authClient.logout(); 
    }
  }
  return authClient;
};
