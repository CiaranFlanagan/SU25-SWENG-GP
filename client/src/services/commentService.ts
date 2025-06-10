import { APIResponse } from '../util/types.ts';
import { api, exceptionToErrorMsg } from './api.ts';
import {
  CommentInfo,
  ErrorMsg,
  UserAuth,
} from '@strategy-town/shared';

const COMMENT_API_URL = `/api/comment`;

/**
 * Sends a POST request to vote on a comment
 */
export const voteOnComment = async (
  auth: UserAuth,
  id: string,
): APIResponse<CommentInfo> => {
  try {
    const res = await api.post<CommentInfo | ErrorMsg>(`${COMMENT_API_URL}/${id}/vote`, {
      auth,
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Sends a DELETE request to remove vote from a comment
 */
export const removeVoteFromComment = async (
  auth: UserAuth,
  id: string,
): APIResponse<CommentInfo> => {
  try {
    const res = await api.delete<CommentInfo | ErrorMsg>(`${COMMENT_API_URL}/${id}/vote`, {
      data: { auth },
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};