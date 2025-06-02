import { type InferSchemaType, model, Schema } from 'mongoose';
import { populateArgsForSafeUserInfo } from './user.model.ts';
import { type PopulateArgs } from '../types.ts';

export type VoteRecord = InferSchemaType<typeof voteSchema>;
const voteSchema = new Schema({
  vote: { type: Boolean, required: true },
  itemType: { type: String, enum: ['Thread', 'Comment'], required: true },
  itemId: { type: Schema.Types.ObjectId, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, required: true },
});

/**
 * Represents a vote in the database.
 * - `vote`: the vote value (true for upvote, false for downvote)
 * - `itemType`: the type of item voted on ('Thread' or 'Comment')
 * - `itemId`: the ID of the item voted on
 * - `createdBy`: the user who voted
 * - `createdAt`: the time of vote creation
 */
export const VoteModel = model<VoteRecord>('Vote', voteSchema);

/**
 * MongoDB options that will cause a populated Vote path to match the
 * VoteInfo interface, without any extras.
 */
export const populateArgsForVoteInfo: PopulateArgs = {
  select: '-__v',
  populate: [{ path: 'createdBy', ...populateArgsForSafeUserInfo }],
};
