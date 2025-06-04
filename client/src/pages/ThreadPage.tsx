import './ThreadPage.css';
import { useParams } from 'react-router-dom';
import useThreadInfo from '../hooks/useThreadInfo.ts';
import dayjs from 'dayjs';
import { useState } from 'react';
import NewForumComment from '../components/NewForumComment.tsx';
import UserLink from '../components/UserLink.tsx';

export default function ThreadPage() {
  const { threadId } = useParams();

  // non-nullish assertion is okay here given that Thread is only called in a
  // route with `:threadId` on the path
  const { threadInfo, setThread } = useThreadInfo(threadId!);

  // update 'now' when the threadInfo is updated
  const [now] = useState(new Date());

  return (
    <div className='content'>
      {'message' in threadInfo ? (
        threadInfo.message
      ) : (
        <div className='spacedSection'>
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
          <div className='dottedList'>
            {threadInfo.comments.map(({ _id, text, createdBy, createdAt, editedAt }) => (
              <div className='dottedListItem' key={_id}>
                <div>
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
