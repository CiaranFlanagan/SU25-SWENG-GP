import { type ChatInfo } from '@strategy-town/shared';
import { isValidObjectId, Types } from 'mongoose';
import { ChatModel, populateArgsForChatInfo } from '../models/chat.model.ts';
import { type UserWithId } from '../types.ts';

/**
 * Expand a stored chat
 *
 * @param _id - Valid chat id
 * @returns the expanded chat info object
 */
async function populateChatInfo(_id: Types.ObjectId): Promise<ChatInfo> {
  const chat = await ChatModel.findById(_id)
    .select(populateArgsForChatInfo.select)
    .populate<ChatInfo>(populateArgsForChatInfo.populate);

  // The type assertion is justified by the precondition that this is a valid id
  return chat!.toObject();
}

/**
 * Creates and store a new chat
 *
 * @param createdAt - Time of chat creation
 * @returns the chat's info object
 */
export async function createChat(createdAt: Date): Promise<ChatInfo> {
  const chat = await ChatModel.insertOne({
    messages: [],
    createdAt,
  });

  return await populateChatInfo(chat._id);
}

/**
 * Produces the chat for a given id
 *
 * @param chatId - Ostensible chat id
 * @param user - Authenticated user
 * @returns the chat's info object
 * @throws if the chat id is not valid
 */
export async function forceChatById(chatId: string, user: UserWithId): Promise<ChatInfo> {
  if (!isValidObjectId(chatId)) throw new Error(`user ${user.username} accessed invalid chat id`);
  const chat = await ChatModel.findById(new Types.ObjectId(chatId));
  if (!chat) throw new Error(`user ${user.username} accessed invalid chat id`);

  return populateChatInfo(chat._id);
}

/**
 * Adds a message to a chat, updating the chat
 *
 * @param chatId - Ostensible chat id
 * @param user - Authenticated user
 * @param message - Valid message id
 * @returns the updated chat info object
 * @throws if the chat id is not valid
 */
export async function addMessageToChat(
  chatId: string,
  user: UserWithId,
  message: Types.ObjectId,
): Promise<ChatInfo> {
  if (!isValidObjectId(chatId)) throw new Error(`user ${user.username} sent to invalid chat id`);
  const chat = await ChatModel.findByIdAndUpdate(chatId, {
    $push: { messages: message },
  });
  if (!chat) throw new Error(`user ${user.username} sent to invalid chat id`);
  return await populateChatInfo(chat._id);
}
