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
 * Get all comments
 * @returns all comments in reverse chronological order
 */
export async function getComments(): Promise<CommentInfo[]> {
  const comments = await CommentModel.find()
    .select(populateArgsForCommentInfo.select)
    .populate<CommentInfo>(populateArgsForCommentInfo.populate)
    .sort({ createdAt: -1 })
    .lean();

  return comments.map(comment => ({ ...comment, votes: comment.votes }));
}

/**
 * Get a single comment
 * @param commentId - Ostensible comment ID
 * @returns the comment, or null if the comment does not exist
 */
export async function getCommentById(commentId: string): Promise<CommentInfo | null> {
  if (!isValidObjectId(commentId)) return null;
  const comment = await CommentModel.findById(commentId);
  if (!comment) return null;
  return await populateCommentInfo(comment._id);
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

  const existingVote = await VoteModel.findOne({
    createdBy: user._id,
    itemType: 'Comment',
    itemId: commentId,
  });

  if (existingVote) {
    const comment = await CommentModel.findById(commentId);
    if (!comment) return null;
    return await populateCommentInfo(comment._id);
  }

  const vote = await VoteModel.create({
    createdBy: user._id,
    vote: true,
    createdAt,
    itemType: 'Comment',
    itemId: commentId,
  });

  const comment = await CommentModel.findByIdAndUpdate(commentId, {
    $push: {
      votes: vote._id,
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

  const deletedVote = await VoteModel.findOneAndDelete({
    createdBy: user._id,
    itemType: 'Comment',
    itemId: commentId,
  });

  if (!deletedVote) return null;

  const comment = await CommentModel.findByIdAndUpdate(commentId, {
    $pull: {
      votes: deletedVote._id,
    },
  });
  if (!comment) return null;
  return await populateCommentInfo(comment._id);
}
