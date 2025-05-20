import { z, ZodNumber } from 'zod';
import { type SafeUserInfo } from './user.types.ts';

/**
 * Represents game information needed to load the game page
 * - `_id`: database key
 * - `type`: picks which game this is
 * - `status`: whether the game is waiting, active, or done
 * - `chat`: id for the game's chat
 * - `players`: active players for the game
 * - `createdAt`: when the game was created
 * - `createdBy`: username of the person who created the game
 * - `minPlayers`: the minimum number of players required to start the game
 */
export interface GameInfo {
  _id: string;
  type: GameKey;
  status: 'waiting' | 'active' | 'done';
  chat: string;
  players: SafeUserInfo[];
  createdAt: Date;
  createdBy: SafeUserInfo;
  minPlayers: number;
}

/**
 * Represents game information needed to load a view of a game, which may or
 * may not be in progress.
 * - `_id`: database key
 * - `view`: null if the game is still in a waiting-room state, or the game
 *   view object
 * - `players`: currently active players for the game
 */
export interface GamePlayInfo {
  _id: string;
  view: TaggedGameView | null;
  players: SafeUserInfo[];
}

/*** TYPES USED IN THE GAMES API ***/

export type GameMakeMovePayload = z.infer<typeof zGameMakeMovePayload>;
export const zGameMakeMovePayload = z.object({
  gameId: z.string(),
  move: z.unknown(),
});

/*** INDIVIDUAL GAME TYPES ***/

/**
 * A GameKey selects which game is being played
 */
export type GameKey = z.infer<typeof zGameKey>;
export const zGameKey = z.union([z.literal('nim'), z.literal('guess')]);

export interface NimView {
  remaining: number;
  nextPlayer: number;
}
export type NimMove = z.infer<typeof zNimMove>;
// This is the correct line, but there's a bug in zod:
// https://github.com/colinhacks/zod/issues/4162
// export const zNimMove: ZodNumber = z.int().gte(1).lte(3);
export const zNimMove: ZodNumber = z.number().int().gte(1).lte(3);

export interface GuessView {
  secret?: number;
  guesses: (boolean | number)[];
}
export type GuessMove = z.infer<typeof zGuessMove>;
// This is the correct line, but there's a bug in zod:
// https://github.com/colinhacks/zod/issues/4162
// export const zGuessMove: ZodNumber = z.int().gte(1).lte(100);
export const zGuessMove: ZodNumber = z.number().int().gte(1).lte(100);

export type TaggedGameView = { type: 'nim'; view: NimView } | { type: 'guess'; view: GuessView };
