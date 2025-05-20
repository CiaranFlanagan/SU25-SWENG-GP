import {
  ClientToServerEvents,
  ErrorMsg,
  MessageInfo,
  SafeUserInfo,
  ServerToClientEvents,
} from '@strategy-town/shared';
import { Socket } from 'socket.io-client';

export type StrategySocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Any REST API endpoint that returns `T` must return a promise, and always
 * includes the possibility of failure, so `APIResponse<T>` is shorthand for
 * `Promise<T | { error: string }>`. To check for the error condition in
 * TypeScript, use the `if ('error' in obj)` test.
 */
export type APIResponse<T> = Promise<T | ErrorMsg>;

/**
 * In addition to messages, chats can include socket-introduced messages
 * that a user entered or left the chat.
 */
export type ChatMessage =
  | MessageInfo
  | { _id: string; meta: 'entered'; dateTime: Date; user: SafeUserInfo }
  | { _id: string; meta: 'left'; dateTime: Date; user: SafeUserInfo };

export interface GameProps<View, Move> {
  userPlayerIndex: number;
  players: SafeUserInfo[];
  view: View;
  makeMove: (move: Move) => void;
}
