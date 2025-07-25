import { HttpAgent, Actor } from '@dfinity/agent';
import {
  idlFactory as backendIdl,
  canisterId as backendCanisterId,
} from 'declarations/eduverse_backend';

const isLocal = window.location.hostname === 'localhost';

export async function createBackendActor(identity?: any) {
  const agent = new HttpAgent({
    host: isLocal ? 'http://localhost:4943' : 'https://icp0.io',
    identity,
  });

  if (isLocal) {
    await agent.fetchRootKey().catch((err) => {
      console.warn('Warning: Unable to fetch root key. Is the local replica running?');
      console.error(err);
    });
  }

  return Actor.createActor(backendIdl, {
    agent,
    canisterId: backendCanisterId,
  });
}
