import { useContext } from 'react';
import { LoginContext } from '../contexts/LoginContext.ts';
import { StrategySocket } from '../util/types.ts';
import { SafeUserInfo } from '@strategy-town/shared';

/**
 * Custom hook to access the LoginContext.
 * @throws if outside a LoginContext
 * @returns context information associated with a logged-in user:
 * - `socket`: the Socket.IO connection
 * - `user`: the logged-in user's information
 * - `pass`: the logged-in user's password (it's bad web dev to keep this around! but we're using it for our nonstandard auth process)
 * - `reset`: a callback
 */
export default function useLoginContext(): {
  socket: StrategySocket;
  user: SafeUserInfo;
  pass: string;
  reset: () => void;
} {
  const context = useContext(LoginContext);
  if (!context) {
    throw new Error('Login context is null.');
  }

  return context;
}
