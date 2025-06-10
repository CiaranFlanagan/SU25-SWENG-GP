import { describe, expect, it } from 'vitest';
import supertest, { type Response } from 'supertest';
import { app } from '../src/app.ts';
import { randomUUID } from 'node:crypto';

let response: Response;

const auth1 = { username: 'user1', password: 'pwd1' };
const auth2 = { username: 'user2', password: 'pwd2' };

describe('GET /api/comment/list', () => {
  it('should return all comments', async () => {
    response = await supertest(app).get('/api/comment/list');
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
  });

  it('should return the most recent comment first', async () => {
    response = await supertest(app).get('/api/comment/list');
    expect(response.status).toBe(200);
    expect(response.body[0]).toStrictEqual({
      _id: expect.anything(),
      createdBy: {
        username: 'user3',
        createdAt: expect.anything(),
        display: 'Frau Drei',
      },
      createdAt: expect.anything(),
      text: 'Exciting',
      votes: 0,
    });
  });
});

describe('GET /api/comment/:id', () => {
  it('should return 404 on a bad id', async () => {
    response = await supertest(app).get(`/api/comment/${randomUUID().toString()}`);
    expect(response.status).toBe(404);
  });

  it('should return the comment given the correct id', async () => {
    response = await supertest(app).get(`/api/comment/deadceefdeadceefdeadceef`);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      _id: 'deadceefdeadceefdeadceef',
      createdBy: {
        username: 'user0',
        createdAt: expect.anything(),
        display: 'Strategy.town webmaster',
      },
      createdAt: expect.anything(),
      text: "I'm working on this, stay tuned!",
      votes: [],
    });
  });
});

describe('POST /api/comment/:id/vote', () => {
  const vote = { auth: auth2, payload: {} };

  it('should return 400 on on ill-formed payload', async () => {
    response = await supertest(app)
      .post(`/api/comment/deadceefdeadceefdeadceef/vote`)
      .send({ auth: auth1, payload: 4 });
    expect(response.status).toBe(400);
  });

  it('should return 404 on a bad id', async () => {
    response = await supertest(app).post(`/api/comment/${randomUUID().toString()}/vote`).send(vote);
    expect(response.status).toBe(404);
  });

  it('should return 403 with bad auth', async () => {
    response = await supertest(app)
      .post(`/api/comment/deadceefdeadceefdeadceef/vote`)
      .send({ ...vote, auth: { ...auth1, username: 'user1', password: 'no' } });
    expect(response.status).toBe(403);
  });

  it('should succeed with correct information if the comment id exists', async () => {
    response = await supertest(app).post(`/api/comment/deadceefdeadceefdeadceef/vote`).send(vote);
    expect(response.status).toBe(200);
    expect(response.body?.votes).toStrictEqual([
      {
        _id: expect.anything(),
        createdAt: expect.anything(),
        itemId: 'deadceefdeadceefdeadceef',
        itemType: 'Comment',
        createdBy: { username: 'user2', display: 'Sénior Dos', createdAt: expect.anything() },
        vote: true,
      },
    ]);
  });

  it('should not add a duplicate vote if the user already voted on the comment once', async () => {
    // first time
    const response1 = await supertest(app)
      .post(`/api/comment/deadceefdeadceefdeadceef/vote`)
      .send(vote);
    expect(response1.status).toBe(200);

    // second time
    const response2 = await supertest(app)
      .post(`/api/comment/deadceefdeadceefdeadceef/vote`)
      .send(vote);
    expect(response2.status).toBe(200);

    // # of votes should still be 1 since there shouldn't be a duplicate vote
    expect(response2.body?.votes).toHaveLength(1);
    // then since another vote shouldn't have been added, the vote id should still be the same
    expect(response2.body.votes[0]._id).toBe(response1.body.votes[0]._id);
  });
});

describe('DELETE /api/comment/:id/vote', () => {
  const vote = { auth: auth2, payload: {} };

  it('should return 400 on on ill-formed payload', async () => {
    response = await supertest(app)
      .delete(`/api/comment/deadceefdeadceefdeadceef/vote`)
      .send({ auth: auth1, payload: 4 });
    expect(response.status).toBe(400);
  });

  it('should return 404 on a bad id', async () => {
    response = await supertest(app)
      .delete(`/api/comment/${randomUUID().toString()}/vote`)
      .send(vote);
    expect(response.status).toBe(404);
  });

  it('should return 403 with bad auth', async () => {
    response = await supertest(app)
      .delete(`/api/comment/deadceefdeadceefdeadceef/vote`)
      .send({ ...vote, auth: { ...auth1, username: 'user1', password: 'no' } });
    expect(response.status).toBe(403);
  });

  it('should succeed with correct information when adding a vote first than deleting it', async () => {
    // post to add a vote first
    response = await supertest(app).post(`/api/comment/deadceefdeadceefdeadceef/vote`).send(vote);
    expect(response.status).toBe(200);

    // then delete the vote
    response = await supertest(app).delete(`/api/comment/deadceefdeadceefdeadceef/vote`).send(vote);
    expect(response.status).toBe(200);
    expect(response.body?.votes).toStrictEqual([]);
  });
});
