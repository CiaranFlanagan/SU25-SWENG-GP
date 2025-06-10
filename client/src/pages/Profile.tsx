import { useState } from 'react';
import { useParams } from 'react-router-dom';
import useLoginContext from '../hooks/useLoginContext.ts';
import useUserProfile from '../hooks/useUserProfile.ts';
import dayjs from 'dayjs';
import useEditProfileForm from '../hooks/useEditProfileForm.ts';
import ProfileView from '../components/ProfileView.tsx';

export default function Profile() {
  const { username: routeUsername } = useParams<{ username: string }>();
  const { user: currentUser } = useLoginContext();
  const [now] = useState(new Date());
  const [showPass, setShowPass] = useState(false);

  const isOwnProfile = routeUsername === currentUser.username;

  const { user: otherUser, loading, error } = useUserProfile(routeUsername || '');

  const { display, setDisplay, password, setPassword, confirm, setConfirm, err, handleSubmit } =
    useEditProfileForm();

  if (!isOwnProfile && loading) {
    return <div className='content'>Loading profile...</div>;
  }

  if (!isOwnProfile && error) {
    return (
      <div className='content'>
        <h2>Profile Not Found</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!isOwnProfile && otherUser) {
    return <ProfileView user={otherUser} />;
  }

  return (
    <form className='content spacedSection' onSubmit={handleSubmit}>
      <h2>Profile</h2>
      <div>
        <h3>General information</h3>
        <ul>
          <li>Username: {currentUser.username}</li>
          <li>Account created {dayjs(currentUser.createdAt).from(now)}</li>
        </ul>
      </div>
      <hr />
      <div className='spacedSection'>
        <h3>Display name</h3>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem' }}>
          <input
            className='widefill notTooWide'
            value={display}
            onChange={e => setDisplay(e.target.value)}
            autoComplete='name'
          />
          <button
            className='secondary narrow'
            onClick={e => {
              e.preventDefault(); // Don't submit form
              setDisplay(currentUser.display);
            }}>
            Reset
          </button>
        </div>
      </div>
      <hr />
      <div className='spacedSection'>
        <h3>Reset password</h3>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem' }}>
          <input
            type={showPass ? 'input' : 'password'}
            className='widefill notTooWide'
            placeholder='New password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete='new-password'
          />
          <button
            className='secondary narrow'
            onClick={e => {
              e.preventDefault(); // Don't submit form
              setPassword('');
              setConfirm('');
            }}>
            Reset
          </button>
          <button
            className='secondary narrow'
            aria-label='Toggle show password'
            onClick={e => {
              e.preventDefault(); // Don't submit form
              setShowPass(v => !v);
            }}>
            {showPass ? 'Hide' : 'Reveal'}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem' }}>
          <input
            type={showPass ? 'input' : 'password'}
            className='widefill notTooWide'
            placeholder='Confirm new password'
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            autoComplete='new-password'
          />
        </div>
      </div>
      <hr />
      {err && <p className='error-message'>{err}</p>}
      <div>
        <button className='primary narrow'>Submit</button>
      </div>
      <div className='smallAndGray'>After updating your profile, you will be logged out</div>
    </form>
  );
}
