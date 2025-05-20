import { type InferSchemaType, model, Schema } from 'mongoose';
import { populateArgsForSafeUserInfo } from './user.model.ts';
import { type PopulateArgs } from '../types.ts';

export type CommentRecord = InferSchemaType<typeof commentSchema>;
const commentSchema = new Schema({
  text: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, required: true },
  editedAt: { type: Date },
});

/**
 * Represents a message in the database.
 * - `text`: message contents
 * - `from`: username of message sender
 * - `createdAt`: when the message was sent
 */
export const CommentModel = model<CommentRecord>('Comment', commentSchema);

/**
 * MongoDB options that will cause a populated Comment path to match the
 * CommentInfo interface, without any extras.
 */
export const populateArgsForCommentInfo: PopulateArgs = {
  select: '-__v',
  populate: [{ path: 'createdBy', ...populateArgsForSafeUserInfo }],
};
