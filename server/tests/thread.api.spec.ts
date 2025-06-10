import { describe, expect, it } from 'vitest';
import supertest, { type Response } from 'supertest';
import { app } from '../src/app.ts';
import { randomUUID } from 'node:crypto';

let response: Response;

const auth1 = { username: 'user1', password: 'pwd1' };
const auth2 = { username: 'user2', password: 'pwd2' };

describe('GET /api/thread/list', () => {
  it('should return all threads', async () => {
    response = await supertest(app).get('/api/thread/list');
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(5);
  });

  it('should return the most recent thread first', async () => {
    response = await supertest(app).get('/api/thread/list');
    expect(response.status).toBe(200);
    expect(response.body[0]).toStrictEqual({
      _id: 'abadcafeabadcafeabadcafe',
      comments: 0,
      createdAt: expect.anything(),
      title: 'Nim?',
      createdBy: {
        createdAt: expect.anything(),
        display: 'Yāo',
        username: 'user1',
      },
      votes: [],
    });
  });
});

describe('GET /api/thread/:id', () => {
  it('should return 404 on a bad id', async () => {
    response = await supertest(app).get(`/api/thread/${randomUUID().toString()}`);
    expect(response.status).toBe(404);
  });

  it('should return existing ids', async () => {
    response = await supertest(app).get(`/api/thread/deadbeefdeadbeefdeadbeef`);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      _id: 'deadbeefdeadbeefdeadbeef',
      title: 'Hello strategy townies',
      text: "I'm a big Nim buff and am excited to join this community.",
      comments: [],
      createdBy: { username: 'user1', display: 'Yāo', createdAt: expect.anything() },
      createdAt: new Date('2025-04-02').toISOString(),
      votes: [],
    });
  });
});

describe('POST /api/thread/create', () => {
  it('should return 400 on ill-formed payload', async () => {
    response = await supertest(app).post(`/api/thread/create`).send({ auth1 });
    expect(response.status).toBe(400);
  });

  it('should return 403 with bad auth', async () => {
    response = await supertest(app)
      .post(`/api/thread/create`)
      .send({
        auth: { ...auth1, password: 'no' },
        payload: { title: 'Evil title', text: 'Evil contents' },
      });
    expect(response.status).toBe(403);
  });

  it('should succeed with correct information', async () => {
    response = await supertest(app)
      .post(`/api/thread/create`)
      .send({ auth: auth2, payload: { title: 'Title', text: 'Text' } });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      _id: expect.anything(),
      title: 'Title',
      text: 'Text',
      createdAt: expect.anything(),
      createdBy: {
        username: 'user2',
        display: expect.any(String),
        createdAt: expect.anything(),
      },
      comments: [],
      votes: [],
    });
  });
});

describe('POST /api/thread/:id/comment', () => {
  const comment = { auth: auth2, payload: 'FIRST!' };

  it('should return 400 on on ill-formed payload', async () => {
    response = await supertest(app)
      .post(`/api/thread/deadbeefdeadbeefdeadbeef/comment`)
      .send({ auth: auth1, payload: 4 });
    expect(response.status).toBe(400);
  });

  it('should return 404 on a bad id', async () => {
    response = await supertest(app)
      .post(`/api/thread/${randomUUID().toString()}/comment`)
      .send(comment);
    expect(response.status).toBe(404);
  });

  it('should return 403 with bad auth', async () => {
    response = await supertest(app)
      .post(`/api/thread/deadbeefdeadbeefdeadbeef/comment`)
      .send({ ...comment, auth: { ...auth1, username: 'user1', password: 'no' } });
    expect(response.status).toBe(403);
  });

  it('should succeed with correct information', async () => {
    response = await supertest(app)
      .post(`/api/thread/deadbeefdeadbeefdeadbeef/comment`)
      .send(comment);
    expect(response.status).toBe(200);
    expect(response.body?.comments).toStrictEqual([
      {
        _id: expect.anything(),
        createdAt: expect.anything(),
        text: 'FIRST!',
        createdBy: { username: 'user2', display: 'Sénior Dos', createdAt: expect.anything() },
        votes: [],
      },
    ]);
  });
});

describe('POST /api/thread/:id/vote', () => {
  const vote = { auth: auth2, payload: {} };

  it('should return 400 on on ill-formed payload', async () => {
    response = await supertest(app)
      .post(`/api/thread/deadbeefdeadbeefdeadbeef/vote`)
      .send({ auth: auth1, payload: 4 });
    expect(response.status).toBe(400);
  });

  it('should return 404 on a bad id', async () => {
    response = await supertest(app).post(`/api/thread/${randomUUID().toString()}/vote`).send(vote);
    expect(response.status).toBe(404);
  });

  it('should return 403 with bad auth', async () => {
    response = await supertest(app)
      .post(`/api/thread/deadbeefdeadbeefdeadbeef/vote`)
      .send({ ...vote, auth: { ...auth1, username: 'user1', password: 'no' } });
    expect(response.status).toBe(403);
  });

  it('should succeed with correct information if the thread id exists', async () => {
    response = await supertest(app).post(`/api/thread/deadbeefdeadbeefdeadbeef/vote`).send(vote);
    expect(response.status).toBe(200);
    expect(response.body?.votes).toStrictEqual([
      {
        _id: expect.anything(),
        createdAt: expect.anything(),
        itemId: 'deadbeefdeadbeefdeadbeef',
        itemType: 'Thread',
        createdBy: { username: 'user2', display: 'Sénior Dos', createdAt: expect.anything() },
        vote: true,
      },
    ]);
  });

  it('should not add a duplicate vote if the user already voted on the thread once', async () => {
    // first time
    const response1 = await supertest(app)
      .post(`/api/thread/deadbeefdeadbeefdeadbeef/vote`)
      .send(vote);
    expect(response1.status).toBe(200);

    // second time
    const response2 = await supertest(app)
      .post(`/api/thread/deadbeefdeadbeefdeadbeef/vote`)
      .send(vote);
    expect(response2.status).toBe(200);

    // # of votes should still be 1 since there shouldn't be a duplicate vote
    expect(response2.body?.votes).toHaveLength(1);
    // then since another vote shouldn't have been added, the vote id should still be the same
    expect(response2.body.votes[0]._id).toBe(response1.body.votes[0]._id);
  });
});

describe('DELETE /api/thread/:id/vote', () => {
  const vote = { auth: auth2, payload: {} };

  it('should return 400 on on ill-formed payload', async () => {
    response = await supertest(app)
      .delete(`/api/thread/deadbeefdeadbeefdeadbeef/vote`)
      .send({ auth: auth1, payload: 4 });
    expect(response.status).toBe(400);
  });

  it('should return 404 on a bad id', async () => {
    response = await supertest(app)
      .delete(`/api/thread/${randomUUID().toString()}/vote`)
      .send(vote);
    expect(response.status).toBe(404);
  });

  it('should return 403 with bad auth', async () => {
    response = await supertest(app)
      .delete(`/api/thread/deadbeefdeadbeefdeadbeef/vote`)
      .send({ ...vote, auth: { ...auth1, username: 'user1', password: 'no' } });
    expect(response.status).toBe(403);
  });

  it('should succeed with correct information when adding a vote first than deleting it', async () => {
    // post to add a vote first
    response = await supertest(app).post(`/api/thread/deadbeefdeadbeefdeadbeef/vote`).send(vote);
    expect(response.status).toBe(200);

    // then delete the vote
    response = await supertest(app).delete(`/api/thread/deadbeefdeadbeefdeadbeef/vote`).send(vote);
    expect(response.status).toBe(200);
    expect(response.body?.votes).toStrictEqual([]);
  });
});
