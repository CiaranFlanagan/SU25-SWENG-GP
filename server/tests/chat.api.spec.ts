import supertest from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.ts';

const auth1 = { username: 'user1', password: 'pwd1' };
const auth2 = { username: 'user2', password: 'pwd2' };

describe('POST /api/chat/private', () => {
  it('should start a chat successfully', async () => {
    const response = await supertest(app)
      .post('/api/chat/private')
      .send({
        auth: auth1,
        payload: {
          username: auth2.username,
        },
      });
    expect(response.status).toBe(200);
  });

  it('should fail with bad auth', async () => {
    const response = await supertest(app)
      .post('/api/chat/private')
      .send({
        auth: 'a',
        payload: {
          username: auth2.username,
        },
      });
    expect(response.status).toBe(500);
  });

  it('should fail if given user does not exist', async () => {
    const response = await supertest(app)
      .post('/api/chat/private')
      .send({
        auth: auth1,
        payload: {
          username: 'joe',
        },
      });
    expect(response.status).toBe(404);
  });
});
