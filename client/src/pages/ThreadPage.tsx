import './ThreadPage.css';
import { useParams } from 'react-router-dom';
import useThreadInfo from '../hooks/useThreadInfo.ts';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import NewForumComment from '../components/NewForumComment.tsx';

export default function ThreadPage() {
  const { threadId } = useParams();

  // non-nullish assertion is okay here given that Thread is only called in a
  // route with `:threadId` on the path
  const { threadInfo, setThread } = useThreadInfo(threadId!);

  // update 'now' when the threadInfo is updated
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    setNow(new Date());
  }, [threadInfo]);

  type VotableType = 'comment' | 'thread';

  async function submitVote(id: string, vote: boolean, type: VotableType): Promise<void> {
    const res = await fetch(`/api/${type}/${id}/vote`, {
      method: vote ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth: {
          username: 'user0', // TODO: replace with real auth
          password: 'pwd0',
        },
        payload: {},
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to ${vote ? 'add' : 'remove'} vote: ${await res.text()}`);
    }
  }

  return (
    <div className='content'>
      {'message' in threadInfo ? (
        threadInfo.message
      ) : (
        <div className='spacedSection'>
          <h2>{threadInfo.title}</h2>
          <div className='notTooWide'>{threadInfo.text}</div>
          <div>
            <button onClick={() => submitVote(threadInfo._id, true, 'thread')}>👍</button>
            <span className='scoreNumber'>
              {threadInfo.votes.filter(v => v.vote).length -
                threadInfo.votes.filter(v => !v.vote).length}
            </span>
            <button onClick={() => submitVote(threadInfo._id, false, 'thread')}>👎</button>
          </div>
          <div className='smallAndGray'>
            Posted by {threadInfo.createdBy.display} {dayjs(threadInfo.createdAt).from(now)}
          </div>
          <div className='dottedList'>
            {threadInfo.comments.map(({ _id, text, createdBy, createdAt, editedAt, votes }) => {
              return (
                <div className='dottedListItem' key={_id}>
                  <div>
                    <div>{text}</div>
                    <div className='voteScoreDisplay'>
                      <button onClick={() => submitVote(_id, true, 'comment')}>👍</button>
                      <span className='scoreNumber'>
                        {votes.filter(v => v.vote).length - votes.filter(v => !v.vote).length}
                      </span>
                      <button onClick={() => submitVote(_id, false, 'comment')}>👎</button>
                    </div>
                    <div className='smallAndGray'>
                      Reply by {createdBy.display}
                      {createdBy.username === threadInfo.createdBy.username && (
                        <span className='opBlue'> OP</span>
                      )}{' '}
                      {dayjs(createdAt).from(now)}
                      {editedAt && ` (last edited ${dayjs(editedAt).from(now)})`}
                    </div>
                  </div>
                </div>
              );
            })}
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
