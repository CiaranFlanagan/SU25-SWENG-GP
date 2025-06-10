import { useState } from 'react';
import { VoteInfo } from '@strategy-town/shared';
import useLoginContext from '../hooks/useLoginContext.ts';
import './VoteButton.css';

interface VoteButtonProps {
  votes: VoteInfo[];
  itemId: string;
  itemType: 'Thread' | 'Comment';
  onVote: (itemId: string) => Promise<void>;
  onRemoveVote: (itemId: string) => Promise<void>;
}

export default function VoteButton({
  votes,
  itemId,
  itemType,
  onVote,
  onRemoveVote,
}: VoteButtonProps) {
  const { user } = useLoginContext();
  const [isLoading, setIsLoading] = useState(false);
  const [optimisticVotes, setOptimisticVotes] = useState(votes);

  if (!user) return null;

  const currentUserVote = optimisticVotes.find(vote => vote.createdBy.username === user.username);
  const hasVoted = !!currentUserVote;
  const voteCount = optimisticVotes.length;

  const handleVote = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      if (hasVoted) {
        setOptimisticVotes(prev => prev.filter(vote => vote.createdBy.username !== user.username));
        await onRemoveVote(itemId);
      } else {
        const newVote: VoteInfo = {
          _id: 'temp-' + Date.now(),
          vote: true,
          itemType,
          itemId,
          createdBy: { username: user.username, display: user.display, createdAt: new Date() },
          createdAt: new Date(),
        };
        setOptimisticVotes(prev => [...prev, newVote]);
        await onVote(itemId);
      }
    } catch (error) {
      setOptimisticVotes(votes);
      console.error('Failed to vote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='vote-button'>
      <button
        className={`vote-btn ${hasVoted ? 'voted' : ''} ${isLoading ? 'loading' : ''}`}
        onClick={handleVote}
        disabled={isLoading}
        title={hasVoted ? 'Remove vote' : 'Upvote'}>
        <span className='vote-arrow'>▲</span>
      </button>
      <span className='vote-count'>{voteCount}</span>
    </div>
  );
}
