import { type InferSchemaType, model, Schema, Types } from 'mongoose';
import { type PopulateArgs } from '../types.ts';
import { populateArgsForSafeUserInfo } from './user.model.ts';
import { populateArgsForCommentInfo } from './comment.model.ts';
import { type ThreadInfo } from '@strategy-town/shared';

export type ThreadRecord = InferSchemaType<typeof threadSchema>;
const threadSchema = new Schema({
  title: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  comments: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Comment', required: true }],
    required: true,
  },
});

/**
 * Represents a forum thread as it's stored in the database.
 * - `title`: post title
 * - `text`: post contents
 * - `createdAt`: when the thread was posted
 * - `createdBy`: username of OP
 * - `comments`: replies to the thread
 */
export const ThreadModel = model<ThreadRecord>('Thread', threadSchema);

/**
 * MongoDB options that will cause a populated Thread path to match the
 * ThreadInfo interface, without any extras.
 */
export const populateArgsForThreadInfo: PopulateArgs = {
  select: '-__v',
  populate: [
    { path: 'createdBy', ...populateArgsForSafeUserInfo },
    { path: 'comments', ...populateArgsForCommentInfo },
  ],
};

/** Like ThreadSummary, but has a list of ids instead of full comments */
export interface ThreadSummaryIsh extends Omit<ThreadInfo, 'text' | 'comments'> {
  comments: Types.ObjectId[];
}

/**
 * MongoDB options that will cause a populated Thread path to match the
 * ThreadSummaryIsh interface, without any extras.
 */
export const populateArgsForThreadSummaryIsh: PopulateArgs = {
  select: '-__v -text',
  populate: [{ path: 'createdBy', ...populateArgsForSafeUserInfo }],
};
