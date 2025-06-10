import { useEffect, useState } from 'react';
import { SafeUserInfo } from '@strategy-town/shared';
import { getUserById } from '../services/userService.ts';

/**
 * Custom hook to fetch user profile data by username
 * @param username - The username to fetch profile data for
 * @returns An object containing the user data, loading state, and error message
 */
export default function useUserProfile(username: string) {
  const [user, setUser] = useState<SafeUserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    const fetchUser = async () => {
      setLoading(true);
      setError(null);

      const response = await getUserById(username);

      if (ignore) return;

      if ('error' in response) {
        setError(response.error);
        setUser(null);
      } else {
        setUser(response);
        setError(null);
      }

      setLoading(false);
    };

    fetchUser();

    return () => {
      ignore = true;
    };
  }, [username]);

  return { user, loading, error };
}
