import { SafeUserInfo } from '@strategy-town/shared';
import dayjs from 'dayjs';
import { useState } from 'react';

interface ProfileViewProps {
  user: SafeUserInfo;
}

/**
 * Component for viewing another user's profile (read-only)
 */
export default function ProfileView({ user }: ProfileViewProps) {
  const [now] = useState(new Date());

  return (
    <div className='content spacedSection'>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>{user.display}'s Profile</h2>
      </div>

      <div>
        <h3>General information</h3>
        <ul>
          <li>Username: {user.username}</li>
          <li>Account created {dayjs(user.createdAt).from(now)}</li>
        </ul>
      </div>

      <hr />

      <div className='spacedSection'>
        <h3>Display name</h3>
        <div
          className='widefill notTooWide'
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            background: '#f9f9f9',
          }}>
          {user.display}
        </div>
      </div>
    </div>
  );
}
