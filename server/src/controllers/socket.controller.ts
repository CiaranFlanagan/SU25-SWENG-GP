/* eslint no-console: "off" */

import { type StrategySocket } from '../types.ts';

/**
 * Logs a socket error to the console
 */
export function logSocketError(socket: StrategySocket, err: unknown) {
  if (err instanceof Error) {
    console.log(`ERR! [${socket.id}] error message: "${err.message}"`);
  } else {
    console.log(`ERR! [${socket.id}] unexpected error ${JSON.stringify(err)}`);
  }
}
