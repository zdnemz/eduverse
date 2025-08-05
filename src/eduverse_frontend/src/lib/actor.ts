import { HttpAgent, Actor, Identity } from '@dfinity/agent';
import {
  idlFactory as backendIdl,
  canisterId as backendCanisterId,
} from 'declarations/eduverse_backend';
import { HTTP_HOST, IS_LOCAL } from '@/lib/config';
import { Declaration } from '@/types';

export async function actor(identity: Identity) {
  const authedAgent = await HttpAgent.create({
    identity,
    host: HTTP_HOST,
  });

  if (IS_LOCAL) {
    await authedAgent.fetchRootKey();
  }

  return Actor.createActor<Declaration._SERVICE>(backendIdl, {
    agent: authedAgent,
    canisterId: backendCanisterId,
  });
}
