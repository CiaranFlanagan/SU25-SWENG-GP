import {
  addCommentToThread,
  addVoteToThread,
  createThread,
  getThreadById,
  getThreadSummaries,
  removeVoteFromThread,
} from '../services/thread.service.ts';
import { checkAuth } from '../services/user.service.ts';
import {
  type ThreadInfo,
  type ThreadSummary,
  withAuth,
  zCreateThreadMessage,
} from '@strategy-town/shared';
import { type RestAPI } from '../types.ts';
import { z } from 'zod';

/**
 * Handle GET requests to `/api/thread/list`. Returns all threads in reverse
 * chronological order by creation.
 */
export const getList: RestAPI<ThreadSummary[]> = async (req, res) => {
  res.send(await getThreadSummaries());
};

/**
 * Handle GET requests to `/api/thread/:id`. Returns either 404 or a thread
 * info object.
 */
export const getById: RestAPI<ThreadInfo, { id: string }> = async (req, res) => {
  const thread = await getThreadById(req.params.id);
  if (!thread) {
    res.status(404).send({ error: 'Thread not found' });
    return;
  }

  res.send(thread);
};

/**
 * Handle POST requests to `/api/thread/create` that post a new thread.
 */
export const postCreate: RestAPI<ThreadInfo> = async (req, res) => {
  const body = withAuth(zCreateThreadMessage).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: 'Poorly-formed request' });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user) {
    res.status(403).send({ error: 'Invalid credentials' });
    return;
  }

  res.send(await createThread(user, body.data.payload, new Date()));
};

/**
 * Handle POST requests to `/api/thread/:id/comment` that post a new
 * comment to a thread.
 */
export const postByIdComment: RestAPI<ThreadInfo, { id: string }> = async (req, res) => {
  const body = withAuth(z.string()).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: 'Poorly-formed request' });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user) {
    res.status(403).send({ error: 'Invalid credentials' });
    return;
  }

  const thread = await addCommentToThread(req.params.id, user, body.data.payload, new Date());
  if (!thread) {
    res.status(404).send({ error: 'Thread not found' });
    return;
  }

  res.send(thread);
};

/**
 * Handle POST requests to `/api/thread/:id/vote` that post a new
 * vote to a thread.
 */
export const postByIdVote: RestAPI<ThreadInfo, { id: string }> = async (req, res) => {
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

  const thread = await addVoteToThread(req.params.id, user, new Date());
  if (!thread) {
    res.status(404).send({ error: 'Failed to vote' });
    return;
  }

  res.send(thread);
};

/**
 * Handle DELETE requests to `/api/thread/:id/vote` that remove a vote from a thread.
 */
export const deleteByIdVote: RestAPI<ThreadInfo, { id: string }> = async (req, res) => {
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

  const thread = await removeVoteFromThread(req.params.id, user);
  if (!thread) {
    res.status(404).send({ error: 'Failed to remove vote' });
    return;
  }

  res.send(thread);
};
