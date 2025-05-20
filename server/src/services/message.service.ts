import { type MessageInfo } from '@strategy-town/shared';
import { type UserWithId } from '../types.ts';
import { Types } from 'mongoose';
import { MessageModel, populateArgsForMessageInfo } from '../models/message.model.ts';
import { populateArgsForChatInfo } from '../models/chat.model.ts';

/**
/**
 * Expand a stored message
 *
 * @param _id - Valid message id
 * @returns the expanded message info object
 */
export async function populateMessageInfo(_id: Types.ObjectId): Promise<MessageInfo> {
  const message = await MessageModel.findById(_id)
    .select(populateArgsForChatInfo.select)
    .populate<MessageInfo>(populateArgsForMessageInfo.populate);

  // The type assertion is justified by the precondition that this is a valid id
  return message!.toObject();
}

/**
 * Creates and stores a new message
 *
 * @param user - a valid user
 * @param text - the message's text
 * @param createdAt - the time of message creation
 * @returns the message's info object
 */
export async function createMessage(
  user: UserWithId,
  text: string,
  createdAt: Date,
): Promise<Types.ObjectId> {
  const message = await MessageModel.insertOne({ createdBy: user._id, text, createdAt });

  return message._id;
}
