import { z } from 'zod';
import { type SafeUserInfo } from './user.types.ts';

/**
 * Represents a chat message as exposed to the client
 * - `_id`: database key
 * - `text`: message contents
 * - `createdBy`: message sender
 * - `createdAt`: when the message was sent
 */
export interface MessageInfo {
  _id: string;
  text: string;
  createdBy: SafeUserInfo;
  createdAt: Date;
}

/*** TYPES USED IN THE MESSAGE API ***/

/**
 * Relevant information for creating a new message
 */
export type NewMessagePayload = z.infer<typeof zNewMessageRequest>;
export const zNewMessageRequest = z.object({
  chatId: z.string(),
  text: z.string(),
});
