import './ThreadSummaryView.css';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { ThreadSummary } from '@strategy-town/shared';
import { useState } from 'react';
import UserLink from './UserLink.tsx';
import VoteButton from './VoteButton.tsx';
import { voteOnThread, removeVoteFromThread } from '../services/threadService.ts';
import useAuth from '../hooks/useAuth.ts';
import useLoginContext from '../hooks/useLoginContext.ts';

/**
 * Summarizes information for a single thread as part of a list of threads
 */
export default function ThreadSummaryView({
  _id,
  createdBy,
  createdAt,
  title,
  comments,
  votes,
}: ThreadSummary) {
  const navigate = useNavigate();
  const [now] = useState(new Date());
  const { user } = useLoginContext();

  // Call hooks unconditionally
  const authHook = useAuth();
  let auth = null;
  try {
    auth = user ? authHook : null;
  } catch {
    auth = null;
  }

  const handleThreadVote = async (id: string) => {
    if (!auth) return;
    await voteOnThread(auth, id);
    // Note: For list view, we don't update local state
    // The user will see the change when they navigate to the thread
  };

  const handleThreadRemoveVote = async (id: string) => {
    if (!auth) return;
    await removeVoteFromThread(auth, id);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on vote button
    if ((e.target as HTMLElement).closest('.vote-button')) {
      e.stopPropagation();
      return;
    }
    navigate(`/forum/post/${_id}`);
  };

  return (
    <div className='threadSummary' onClick={handleClick}>
      {user && (
        <div className='voteSection'>
          <VoteButton
            votes={votes || []}
            itemId={_id}
            itemType='Thread'
            onVote={handleThreadVote}
            onRemoveVote={handleThreadRemoveVote}
          />
        </div>
      )}
      <div className='postStats'>
        {comments} {comments === 1 ? 'reply' : 'replies'}
      </div>
      <div className='mid'>{title}</div>
      <div className='lastActivity'>
        <UserLink username={createdBy.username} displayName={createdBy.display} /> posted{' '}
        {dayjs(createdAt).from(now)}
      </div>
    </div>
  );
}
