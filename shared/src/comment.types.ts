import { z } from 'zod';
import { type SafeUserInfo } from './user.types.ts';

/**
 * Represents a forum comment as exposed to the client
 * - `_id`: database key
 * - `text`: comment contents
 * - `createdBy`: comment sender
 * - `createdAt`: when the comment was sent
 * - `editedAt`: when the comment was last modified (if, indeed, it was)
 */
export interface CommentInfo {
  _id: string;
  text: string;
  createdBy: SafeUserInfo;
  createdAt: Date;
  editedAt?: Date;
}

/*** TYPES USED IN THE COMMENT API ***/

/**
 * Relevant information for creating a new message
 */
export type NewCommentPayload = z.infer<typeof zNewCommentRequest>;
export const zNewCommentRequest = z.object({
  chatId: z.string(),
  text: z.string(),
});
