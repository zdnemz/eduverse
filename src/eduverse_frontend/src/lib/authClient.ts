import { AuthClient } from '@dfinity/auth-client';

let authClient: AuthClient | null = null;

export const getAuthClient = async (): Promise<AuthClient> => {
  if (!authClient) {
    authClient = await AuthClient.create();
  }
  return authClient;
};