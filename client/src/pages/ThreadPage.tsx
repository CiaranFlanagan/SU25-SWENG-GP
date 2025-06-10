import './ThreadPage.css';
import { useParams } from 'react-router-dom';
import useThreadInfo from '../hooks/useThreadInfo.ts';
import dayjs from 'dayjs';
import { useState } from 'react';
import NewForumComment from '../components/NewForumComment.tsx';
import UserLink from '../components/UserLink.tsx';
import VoteButton from '../components/VoteButton.tsx';
import { voteOnThread, removeVoteFromThread } from '../services/threadService.ts';
import { voteOnComment, removeVoteFromComment } from '../services/commentService.ts';
import useAuth from '../hooks/useAuth.ts';

export default function ThreadPage() {
  const { threadId } = useParams();
  const auth = useAuth();

  // non-nullish assertion is okay here given that Thread is only called in a
  // route with `:threadId` on the path
  const { threadInfo, setThread } = useThreadInfo(threadId!);

  // update 'now' when the threadInfo is updated
  const [now] = useState(new Date());

  const handleThreadVote = async (id: string) => {
    if (!auth) return;
    const result = await voteOnThread(auth, id);
    if (!('error' in result)) {
      setThread(result);
    }
  };

  const handleThreadRemoveVote = async (id: string) => {
    if (!auth) return;
    const result = await removeVoteFromThread(auth, id);
    if (!('error' in result)) {
      setThread(result);
    }
  };

  const handleCommentVote = async (commentId: string) => {
    if (!auth) return;
    const result = await voteOnComment(auth, commentId);
    if (!('error' in result)) {
      // Update the thread with the new comment data
      if (!('message' in threadInfo)) {
        const updatedComments = threadInfo.comments
          .map(comment => (comment._id === commentId ? result : comment))
          .sort((a, b) => b.votes.length - a.votes.length);
        setThread({ ...threadInfo, comments: updatedComments });
      }
    }
  };

  const handleCommentRemoveVote = async (commentId: string) => {
    if (!auth) return;
    const result = await removeVoteFromComment(auth, commentId);
    if (!('error' in result)) {
      // Update the thread with the new comment data
      if (!('message' in threadInfo)) {
        const updatedComments = threadInfo.comments
          .map(comment => (comment._id === commentId ? result : comment))
          .sort((a, b) => b.votes.length - a.votes.length);
        setThread({ ...threadInfo, comments: updatedComments });
      }
    }
  };

  return (
    <div className='content'>
      {'message' in threadInfo ? (
        threadInfo.message
      ) : (
        <div className='spacedSection'>
          <div className='thread-header'>
            <VoteButton
              votes={threadInfo.votes || []}
              itemId={threadInfo._id}
              itemType='Thread'
              onVote={handleThreadVote}
              onRemoveVote={handleThreadRemoveVote}
            />
            <div className='thread-content'>
              <h2>{threadInfo.title}</h2>
              <div className='notTooWide'>{threadInfo.text}</div>
              <div className='smallAndGray'>
                Posted by{' '}
                <UserLink
                  username={threadInfo.createdBy.username}
                  displayName={threadInfo.createdBy.display}
                />{' '}
                {dayjs(threadInfo.createdAt).from(now)}
              </div>
            </div>
          </div>
          <div className='dottedList'>
            {threadInfo.comments.map(({ _id, text, createdBy, createdAt, editedAt, votes }) => (
              <div className='dottedListItem' key={_id}>
                <div className='comment-container'>
                  <VoteButton
                    votes={votes || []}
                    itemId={_id}
                    itemType='Comment'
                    onVote={handleCommentVote}
                    onRemoveVote={handleCommentRemoveVote}
                  />
                  <div className='comment-content'>
                    <div>{text}</div>
                    <div className='smallAndGray'>
                      Reply by{' '}
                      <UserLink username={createdBy.username} displayName={createdBy.display} />{' '}
                      {createdBy.username === threadInfo.createdBy.username && (
                        <span className='opBlue'> OP</span>
                      )}{' '}
                      {dayjs(createdAt).from(now)}
                      {editedAt && ` (last edited ${dayjs(editedAt).from(now)})`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <NewForumComment
            firstPost={threadInfo.comments.length === 0}
            threadId={threadInfo._id.toString()}
            setThread={setThread}
          />
        </div>
      )}
    </div>
  );
}
