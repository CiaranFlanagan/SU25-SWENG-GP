import type { UserAuth } from '@strategy-town/shared';

export function authHeader(): UserAuth {
  return {
    username: localStorage.getItem('username') ?? '',
    password: localStorage.getItem('password') ?? '',
  };
}
