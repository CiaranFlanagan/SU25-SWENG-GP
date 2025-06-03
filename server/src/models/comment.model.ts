import { type InferSchemaType, model, Schema } from 'mongoose';
import { populateArgsForSafeUserInfo } from './user.model.ts';
import { populateArgsForVoteInfo } from './vote.model.ts';
import { type PopulateArgs } from '../types.ts';

export type CommentRecord = InferSchemaType<typeof commentSchema>;
const commentSchema = new Schema({
  text: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, required: true },
  editedAt: { type: Date },
  votes: { type: [Schema.Types.ObjectId], ref: 'Vote', required: true, default: [] },
});

/**
 * Represents a comment in the database.
 * - `text`: comment contents
 * - `createdBy`: username of comment sender
 * - `createdAt`: when the comment was posted
 * - `votes`: the votes on the comment
 */
export const CommentModel = model<CommentRecord>('Comment', commentSchema);

/**
 * MongoDB options that will cause a populated Comment path to match the
 * CommentInfo interface, without any extras.
 */
export const populateArgsForCommentInfo: PopulateArgs = {
  select: '-__v',
  populate: [
    { path: 'createdBy', ...populateArgsForSafeUserInfo },
    { path: 'votes', ...populateArgsForVoteInfo },
  ],
};
