import { type SafeUserInfo } from './user.types.ts';

/**
 * Represents a vote on a thread or comment.
 * - `_id`: database key
 * - `vote`: the vote value (true for upvote, false for downvote)
 * - `itemType`: the type of item voted on ('Thread' or 'Comment')
 * - `itemId`: the ID of the item voted on
 * - `createdBy`: the user who voted
 * - `createdAt`: the time of vote creation
 */
export interface VoteInfo {
  _id: string;
  vote: boolean;
  itemType: 'Thread' | 'Comment';
  itemId: string;
  createdBy: SafeUserInfo;
  createdAt: Date;
}
