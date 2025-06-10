import { useState } from 'react';
import ChatPanel from '../components/ChatPanel.tsx';
import useLoginContext from '../hooks/useLoginContext.ts';
import { api } from '../services/api.ts';

export default function PrivateChat() {
  const { user } = useLoginContext();
  const [search, setSearch] = useState('');
  type UserResult = { username: string; display?: string };
  const [results, setResults] = useState<UserResult[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await api.post('/api/user/list', [search]);
      if (Array.isArray(res.data)) {
        setResults(res.data as UserResult[]);
        if (res.data.length === 0) setErr('No users found.');
      } else if (res.data && typeof res.data === 'object' && 'error' in res.data) {
        setResults([]);
        setErr((res.data as { error: string }).error);
      } else {
        setResults([]);
        setErr('No users found.');
      }
    } catch (e) {
      setErr('Failed to search users');
    } finally {
      setLoading(false);
    }
  }

  async function startChatWith(username: string) {

  }

  return (
    <div className='content'>
      <h2>Private Chat</h2>
      {err && <div className='error-message'>{err}</div>}
      {!chatId ? (
        <form onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder='Search users...'
            className='widefill'
          />
          <button className='primary narrow' type='submit' disabled={loading}>
            Search
          </button>
          <ul>
            {results
              .filter(u => u.username !== user.username)
              .map(u => (
                <li key={u.username}>
                  {u.display || u.username}{' '}
                  <button
                    className='secondary narrow'
                    type='button'
                    onClick={() => startChatWith(u.username)}
                    disabled={loading}>
                    Chat
                  </button>
                </li>
              ))}
          </ul>
        </form>
      ) : (
        <ChatPanel chatId={chatId} />
      )}
    </div>
  );
}
