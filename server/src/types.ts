import { type Server, type Socket } from 'socket.io';
import { type Request, type Response } from 'express';
import {
  type ClientToServerEvents,
  type ServerToClientEvents,
  type TaggedGameView,
} from '@strategy-town/shared';
import { type PopulateOptions, type Types } from 'mongoose';

export type SocketAPI = (socket: StrategySocket, io: StrategyServer) => (payload: unknown) => void;

export type RestAPI<R = unknown, P = { [key: string]: string }> = (
  req: Request<P, R | { error: string }, unknown>,
  res: Response<R | { error: string }>,
) => Promise<void>;

export type StrategyServer = Server<ClientToServerEvents, ServerToClientEvents>;
export type StrategySocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export interface GameViewUpdates {
  watchers: TaggedGameView;
  players: { userId: Types.ObjectId; view: TaggedGameView }[];
}

export interface UserWithId {
  _id: Types.ObjectId;
  username: string;
}

export interface PopulateArgs {
  select: string;
  populate: PopulateOptions[];
}
