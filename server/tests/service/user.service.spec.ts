import { describe, expect, it } from 'vitest';
import { enforceAuth } from '../../src/services/user.service.ts';
import { Types } from 'mongoose';

// enforceAuth isn't tested by current integration tests,
// because existing tests exercise the REST api, and enforceAuth
// is only used in the socket api
describe('enforceAuth', () => {
  it('should return a user and id on good auth', async () => {
    const user = await enforceAuth({ username: 'user1', password: 'pwd1' });
    expect(user).toStrictEqual({ _id: expect.any(Types.ObjectId), username: 'user1' });
  });

  it('should raise on bad auth', async () => {
    await expect(enforceAuth({ username: 'user1', password: 'no' })).rejects.toThrow();
  });
});
