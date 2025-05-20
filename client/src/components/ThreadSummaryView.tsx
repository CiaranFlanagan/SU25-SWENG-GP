import './ThreadSummaryView.css';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { ThreadSummary } from '@strategy-town/shared';
import { useState } from 'react';

/**
 * Summarizes information for a single thread as part of a list of threads
 */
export default function ThreadSummaryView({
  _id,
  createdBy,
  createdAt,
  title,
  comments,
}: ThreadSummary) {
  const navigate = useNavigate();
  const [now] = useState(new Date());

  return (
    <div className='threadSummary' onClick={() => navigate(`/forum/post/${_id}`)}>
      <div className='postStats'>
        {comments} {comments === 1 ? 'reply' : 'replies'}
      </div>
      <div className='mid'>{title}</div>
      <div className='lastActivity'>
        {createdBy.display} posted {dayjs(createdAt).from(now)}
      </div>
    </div>
  );
}
