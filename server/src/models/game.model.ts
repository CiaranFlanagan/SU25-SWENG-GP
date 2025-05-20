import { type InferSchemaType, model, Schema } from 'mongoose';
import { populateArgsForSafeUserInfo } from './user.model.ts';
import { type PopulateArgs } from '../types.ts';
import { type GameKey, type SafeUserInfo } from '@strategy-town/shared';

export type GameRecord = InferSchemaType<typeof gameSchema>;
const gameSchema = new Schema({
  type: { type: String, required: true },
  state: { type: Schema.Types.Mixed },
  done: { type: Boolean, required: true },
  // While Chat contains an ObjectId that refers to the Chat model, we don't
  // use that knowledge within MongoDb — MongoDb sends the chat id to the
  // frontend, which separately asks to connect to the chat. Therefore, it
  // is reasonable to leave the chat field as a string and not an ObjectId ref
  chat: { type: String, required: true },
  players: { type: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }], required: true },
  createdAt: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

/**
 * Represents a game document in the database.
 * - `type`: picks which game this is
 * - `state`: null if the game hasn't started, or the id for the game's state
 * - `done`: game's done state (must be false if state is null)
 * - `chat`: id for the game's chat
 * - `players`: active players for the game
 * - `createdAt`: when the game was created
 * - `createdBy`: username of the person who created the game
 */
export const GameModel = model<GameRecord>('Game', gameSchema);

/**
 * Passing this type to the .populate() method will give the appropriate type
 * to the resulting objects.
 */
export interface GameInfoIsh {
  type: GameKey;
  players: SafeUserInfo[];
  createdBy: SafeUserInfo;
}

export const populateArgsForGameInfoIsh: PopulateArgs = {
  select: '-__v',
  populate: [
    { path: 'createdBy', ...populateArgsForSafeUserInfo },
    { path: 'players', ...populateArgsForSafeUserInfo },
  ],
};
