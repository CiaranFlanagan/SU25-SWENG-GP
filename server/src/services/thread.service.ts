import {
  type CreateThreadMessage,
  type ThreadInfo,
  type ThreadSummary,
} from '@strategy-town/shared';
import { type UserWithId } from '../types.ts';
import {
  type ThreadSummaryIsh,
  populateArgsForThreadInfo,
  populateArgsForThreadSummaryIsh,
  ThreadModel,
} from '../models/thread.model.ts';
import { isValidObjectId, Types } from 'mongoose';
import { CommentModel } from '../models/comment.model.ts';
import { VoteModel } from '../models/vote.model.ts';

/**
 * Expand a stored thread
 *
 * @param _id - Valid thread id
 * @returns the expanded thread info object
 */
async function populateThreadInfo(_id: Types.ObjectId): Promise<ThreadInfo> {
  const thread = await ThreadModel.findById(_id)
    .select(populateArgsForThreadInfo.select)
    .populate<ThreadInfo>(populateArgsForThreadInfo.populate);

  // The type assertion is justified by the precondition that this is a valid id
  return thread!.toObject();
}

/**
 * Create and store a new thread
 *
 * @param user - The thread poster
 * @param contents - Title and text of the thread
 * @param createdAt - Creation time for this thread
 * @returns the new thread's info object
 */
export async function createThread(
  user: UserWithId,
  { title, text }: CreateThreadMessage,
  createdAt: Date,
): Promise<ThreadInfo> {
  const thread = await ThreadModel.create({
    title,
    text,
    createdAt,
    createdBy: user._id,
    comments: [],
  });
  return await populateThreadInfo(thread._id);
}

/**
 * Retrieves a single thread from the database
 *
 * @param _id - Ostensible thread ID
 * @returns the thread, or null if no thread with that ID exists
 */
export async function getThreadById(_id: string): Promise<ThreadInfo | null> {
  if (!isValidObjectId(_id)) return null;
  const thread = await ThreadModel.findById(new Types.ObjectId(_id));
  if (!thread) return null;
  return await populateThreadInfo(thread._id);
}

/**
 * Get a list of all threads
 *
 * @returns a list of thread summaries, ordered reverse chronologically by creation date
 */
export async function getThreadSummaries(): Promise<ThreadSummary[]> {
  const threads = await ThreadModel.find()
    .select(populateArgsForThreadSummaryIsh.select)
    .populate<ThreadSummaryIsh>(populateArgsForThreadSummaryIsh.populate)
    .sort({ createdAt: -1 })
    .lean(); // lean() is an alternative to calling toObject

  return threads.map(thread => ({ ...thread, comments: thread.comments.length }));
}

/**
 * Add a comment id to a thread
 * @param threadId - Ostensible thread ID
 * @param user - Commenting user
 * @param text - Contents of the thread
 * @param createdAt - Creation time for thread
 * @returns the updated thread with comment attached, or null if the thread does not exist
 */
export async function addCommentToThread(
  threadId: string,
  user: UserWithId,
  text: string,
  createdAt: Date,
): Promise<ThreadInfo | null> {
  if (!isValidObjectId(threadId)) return null;

  const comment = await CommentModel.create({
    createdBy: user._id,
    text,
    createdAt,
  });

  const thread = await ThreadModel.findByIdAndUpdate(threadId, {
    $push: {
      comments: comment._id,
    },
  });
  if (!thread) return null;
  return await populateThreadInfo(thread._id);
}

/**
 * Add a vote to a thread
 * @param threadId - Ostensible thread ID
 * @param user - Voting user
 * @param createdAt - Creation time for vote
 * @returns the updated thread with vote attached, or null if the thread does not exist
 */
export async function addVoteToThread(
  threadId: string,
  user: UserWithId,
  createdAt: Date,
): Promise<ThreadInfo | null> {
  if (!isValidObjectId(threadId)) return null;

  const existingVote = await VoteModel.findOne({
    createdBy: user._id,
    itemType: 'Thread',
    itemId: threadId,
  });

  if (existingVote) {
    const thread = await ThreadModel.findById(threadId);
    if (!thread) return null;
    return await populateThreadInfo(thread._id);
  }

  const vote = await VoteModel.create({
    createdBy: user._id,
    vote: true,
    createdAt,
    itemType: 'Thread',
    itemId: threadId,
  });

  const thread = await ThreadModel.findByIdAndUpdate(threadId, {
    $push: {
      votes: vote._id,
    },
  });

  if (!thread) return null;
  return await populateThreadInfo(thread._id);
}

/**
 * Remove a vote from a thread
 * @param threadId - Ostensible thread ID
 * @param user - Voting user
 * @returns the updated thread with vote removed, or null if the thread does not exist
 */
export async function removeVoteFromThread(
  threadId: string,
  user: UserWithId,
): Promise<ThreadInfo | null> {
  if (!isValidObjectId(threadId)) return null;

  const deletedVote = await VoteModel.findOneAndDelete({
    createdBy: user._id,
    itemType: 'Thread',
    itemId: threadId,
  });

  if (!deletedVote) return null;

  const thread = await ThreadModel.findByIdAndUpdate(threadId, {
    $pull: {
      votes: deletedVote._id,
    },
  });
  if (!thread) return null;
  return await populateThreadInfo(thread._id);
}
