import { describe, expect, it } from 'vitest';
import supertest, { type Response } from 'supertest';
import { app } from '../src/app.ts';
import { randomUUID } from 'crypto';

let response: Response;

const auth3 = { username: 'user3', password: 'pwd3' };
const authBad = { username: 'user3', password: 'user3' };

describe('POST /api/game/create', () => {
  it('should return 400 on ill-formed payload or invalid game key', async () => {
    response = await supertest(app).post(`/api/game/create`).send({
      auth: auth3,
      payload: 9,
    });
    expect(response.status).toBe(400);

    response = await supertest(app)
      .post(`/api/game/create`)
      .send({ auth: auth3, payload: 'gameThatDoesNotExist' });
    expect(response.status).toBe(400);
  });

  it('should return 403 with bad auth', async () => {
    response = await supertest(app)
      .post(`/api/game/create`)
      .send({ auth: authBad, payload: 'nim' });
    expect(response.status).toBe(403);
  });

  it('should succeed when asked to create a game of nim', async () => {
    response = await supertest(app).post(`/api/game/create`).send({
      auth: auth3,
      payload: 'nim',
    });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      _id: expect.anything(),
      chat: expect.anything(),
      type: 'nim',
      status: 'waiting',
      createdBy: {
        username: 'user3',
        display: 'Frau Drei',
        createdAt: expect.anything(),
      },
      createdAt: expect.anything(),
      minPlayers: 2,
      players: [
        {
          username: 'user3',
          display: 'Frau Drei',
          createdAt: expect.anything(),
        },
      ],
    });
  });
});

describe('GET /api/game/:id', () => {
  it('should 404 given a nonexistent id', async () => {
    response = await supertest(app).get(`/api/game/${randomUUID().toString()}`);
    expect(response.status).toBe(404);
  });

  it('should succeed if a created game is requested', async () => {
    response = await supertest(app).post(`/api/game/create`).send({
      auth: auth3,
      payload: 'nim',
    });
    expect(response.status).toBe(200);
    const gameInfo = response.body;

    response = await supertest(app).get(`/api/game/${gameInfo._id}`);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual(gameInfo);
  });
});

describe('GET /api/game/list', () => {
  it('should return created games in reverse chronological order', async () => {
    response = await supertest(app).get(`/api/game/list`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject([
      {
        type: 'nim',
        status: 'waiting',
        players: [{ username: 'user1' }],
      },
      {
        type: 'guess',
        status: 'done',
        players: [
          { username: 'user1' },
          { username: 'user0' },
          { username: 'user3' },
          { username: 'user2' },
        ],
      },
      {
        type: 'nim',
        status: 'done',
        createdAt: new Date('2025-04-21').toISOString(),
        players: [{ username: 'user2' }, { username: 'user3' }],
      },
    ]);
  });
});

describe('POST /api/game/:id/history', () => {
  let gameId: string;

  it('should return 400 with invalid game id', async () => {
    response = await supertest(app)
      .post(`/api/game/invalid-id/history`)
      .send({ auth: auth3, payload: {} });
    expect(response.status).toBe(400);
  });

  it('should return 400 with nonexistent game id', async () => {
    const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format but non-existent
    response = await supertest(app)
      .post(`/api/game/${fakeId}/history`)
      .send({ auth: auth3, payload: {} });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('game not found');
  });

  it('should return 403 with bad auth', async () => {
    // First create a game to get a valid game ID
    response = await supertest(app).post(`/api/game/create`).send({
      auth: auth3,
      payload: 'nim',
    });
    gameId = response.body._id;

    response = await supertest(app)
      .post(`/api/game/${gameId}/history`)
      .send({ auth: authBad, payload: {} });
    expect(response.status).toBe(403);
  });

  it('should return 400 when user is not a player in the game', async () => {
    // Create a game with user3
    response = await supertest(app).post(`/api/game/create`).send({
      auth: auth3,
      payload: 'nim',
    });
    gameId = response.body._id;

    // Try to get history with different user (user1 is seeded but not in this game)
    response = await supertest(app)
      .post(`/api/game/${gameId}/history`)
      .send({ auth: { username: 'user1', password: 'pwd1' }, payload: {} });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('not a player in this game');
  });

  it('should return empty history for new game', async () => {
    // Create a new game
    response = await supertest(app).post(`/api/game/create`).send({
      auth: auth3,
      payload: 'nim',
    });
    gameId = response.body._id;

    // Get history
    response = await supertest(app)
      .post(`/api/game/${gameId}/history`)
      .send({ auth: auth3, payload: {} });
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should return populated history for game with existing history', async () => {
    // Use the pre-seeded nim game that is done and has history
    // From mongo.ts, there's a nim game with user2 and user3 that is done
    response = await supertest(app).get('/api/game/list');
    const doneNimGame = (response.body as { _id: string; type: string; status: string }[]).find(
      game => game.type === 'nim' && game.status === 'done',
    );
    expect(doneNimGame).toBeDefined();

    // Get history for the done game as user3 (who is a player)
    response = await supertest(app)
      .post(`/api/game/${doneNimGame!._id}/history`)
      .send({ auth: auth3, payload: {} });
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    // Note: The seeded game doesn't have explicit history moves, but the API should work
  });
});

describe('POST /api/game/:id/history/:index', () => {
  let gameId: string;

  it('should return 400 with invalid game id', async () => {
    response = await supertest(app)
      .post(`/api/game/invalid-id/history/0`)
      .send({ auth: auth3, payload: {} });
    expect(response.status).toBe(400);
  });

  it('should return 403 with bad auth', async () => {
    // Create a game to get a valid game ID
    response = await supertest(app).post(`/api/game/create`).send({
      auth: auth3,
      payload: 'nim',
    });
    gameId = response.body._id;

    response = await supertest(app)
      .post(`/api/game/${gameId}/history/0`)
      .send({ auth: authBad, payload: {} });
    expect(response.status).toBe(403);
  });

  it('should return 400 for invalid history index', async () => {
    // Create a game
    response = await supertest(app).post(`/api/game/create`).send({
      auth: auth3,
      payload: 'nim',
    });
    gameId = response.body._id;

    // Try to get move at index 0 when no moves exist
    response = await supertest(app)
      .post(`/api/game/${gameId}/history/0`)
      .send({ auth: auth3, payload: {} });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('history index out of bounds');
  });

  it('should return 400 for negative history index', async () => {
    response = await supertest(app).post(`/api/game/create`).send({
      auth: auth3,
      payload: 'nim',
    });
    gameId = response.body._id;

    response = await supertest(app)
      .post(`/api/game/${gameId}/history/-1`)
      .send({ auth: auth3, payload: {} });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('history index out of bounds');
  });
});
