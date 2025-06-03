import { withAuth, type CommentInfo } from '@strategy-town/shared';
import { checkAuth } from '../services/user.service.ts';
import type { RestAPI } from '../types.ts';
import { addVoteToComment, removeVoteFromComment } from '../services/comment.service.ts';
import { z } from 'zod';

/**
 * Handle POST requests to `/api/comment/:id/vote` that post a new
 * vote to a comment.
 */
export const postByIdVote: RestAPI<CommentInfo, { id: string }> = async (req, res) => {
  const body = withAuth(z.object()).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: 'Poorly-formed request' });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user) {
    res.status(403).send({ error: 'Invalid credentials' });
    return;
  }

  const comment = await addVoteToComment(req.params.id, user, new Date());
  if (!comment) {
    res.status(404).send({ error: 'Comment not found' });
    return;
  }

  res.send(comment);
};

/**
 * Handle DELETE requests to `/api/comment/:id/vote` that remove a vote from a comment.
 */
export const deleteByIdVote: RestAPI<CommentInfo, { id: string }> = async (req, res) => {
  const body = withAuth(z.object()).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: 'Poorly-formed request' });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user) {
    res.status(403).send({ error: 'Invalid credentials' });
    return;
  }

  const comment = await removeVoteFromComment(req.params.id, user);
  if (!comment) {
    res.status(404).send({ error: 'Comment not found' });
    return;
  }

  res.send(comment);
};
