import { type InferSchemaType, model, Schema } from 'mongoose';
import { type PopulateArgs } from '../types.ts';
import { populateArgsForSafeUserInfo } from './user.model.ts';

export type MessageRecord = InferSchemaType<typeof messageSchema>;
const messageSchema = new Schema({
  text: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, required: true },
});

/**
 * Represents a message in the database.
 * - `text`: message contents
 * - `createdBy`: username of message sender
 * - `createdAt`: when the message was sent
 */
export const MessageModel = model<MessageRecord>('Message', messageSchema);

/**
 * MongoDB options that will cause a populated Message path to match the
 * MessageInfo interface, without any extras.
 */
export const populateArgsForMessageInfo: PopulateArgs = {
  select: '-__v',
  populate: [{ path: 'createdBy', ...populateArgsForSafeUserInfo }],
};
