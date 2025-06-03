import { isValidObjectId, Types } from 'mongoose';
import type { UserWithId } from '../types.ts';
import type { CommentInfo } from '@strategy-town/shared';
import { VoteModel } from '../models/vote.model.ts';
import { CommentModel, populateArgsForCommentInfo } from '../models/comment.model.ts';

/**
 * Expand a stored comment
 *
 * @param _id - Valid comment id
 * @returns the expanded comment info object
 */
async function populateCommentInfo(_id: Types.ObjectId): Promise<CommentInfo> {
  const comment = await CommentModel.findById(_id)
    .select(populateArgsForCommentInfo.select)
    .populate<CommentInfo>(populateArgsForCommentInfo.populate);

  // The type assertion is justified by the precondition that this is a valid id
  return comment!.toObject();
}

/**
 * Add a vote to a comment
 * @param commentId - Ostensible comment ID
 * @param user - Voting user
 * @param createdAt - Creation time for vote
 * @returns the updated comment with vote attached, or null if the comment does not exist
 */
export async function addVoteToComment(
  commentId: string,
  user: UserWithId,
  createdAt: Date,
): Promise<CommentInfo | null> {
  if (!isValidObjectId(commentId)) return null;
  const comment = await CommentModel.findByIdAndUpdate(commentId, {
    $push: {
      votes: await VoteModel.insertOne({
        createdBy: user._id,
        vote: true,
        createdAt,
        itemType: 'Comment',
        itemId: commentId,
      }),
    },
  });
  if (!comment) return null;
  return await populateCommentInfo(comment._id);
}

/**
 * Remove a vote from a comment
 * @param commentId - Ostensible comment ID
 * @param user - Voting user
 * @returns the updated comment with vote removed, or null if the comment does not exist
 */
export async function removeVoteFromComment(
  commentId: string,
  user: UserWithId,
): Promise<CommentInfo | null> {
  if (!isValidObjectId(commentId)) return null;
  const comment = await CommentModel.findByIdAndUpdate(commentId, {
    $pull: {
      votes: await VoteModel.findOneAndDelete({
        createdBy: user._id,
        itemType: 'Comment',
        itemId: commentId,
      }),
    },
  });
  if (!comment) return null;
  return await populateCommentInfo(comment._id);
}
