import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { Types } from 'mongoose';
import {
  createGame,
  updateGame,
  getGameHistory,
  getGameHistoryMove,
} from '../../src/services/game.service.ts';
import { GameModel } from '../../src/models/game.model.ts';
import { UserModel } from '../../src/models/user.model.ts';
import { type UserWithId } from '../../src/types.ts';

describe('Game History Service', () => {
  let testUser1: UserWithId, testUser2: UserWithId;
  let gameId: string;

  beforeEach(async () => {
    const uniqueSuffix = Date.now().toString() + Math.random().toString(36).substring(2);
    const users = await UserModel.insertMany([
      {
        username: `historytest1_${uniqueSuffix}`,
        display: 'History Test User 1',
        password: 'testpass',
        createdAt: new Date(),
      },
      {
        username: `historytest2_${uniqueSuffix}`,
        display: 'History Test User 2',
        password: 'testpass',
        createdAt: new Date(),
      },
    ]);

    testUser1 = users[0] as UserWithId;
    testUser2 = users[1] as UserWithId;
  });

  afterEach(async () => {
    try {
      if (gameId) {
        await GameModel.findByIdAndDelete(new Types.ObjectId(gameId));
      }
      if (testUser1?.username && testUser2?.username) {
        await UserModel.deleteMany({
          username: {
            $in: [testUser1.username, testUser2.username],
          },
        });
      }
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }
  });

  describe('History Storage', () => {
    it('should initialize game with empty history', async () => {
      const game = await createGame(testUser1, 'nim', new Date());
      gameId = game._id;

      const history = await getGameHistory(gameId, testUser1);
      expect(history).toEqual([]);
    });

    it('should store move history when game is updated', async () => {
      const game = await createGame(testUser1, 'nim', new Date());
      gameId = game._id;

      await GameModel.findByIdAndUpdate(game._id, {
        $push: { players: testUser2._id },
      });

      await GameModel.findByIdAndUpdate(game._id, {
        state: { remaining: 21, nextPlayer: 0 },
      });

      const move1 = 3;
      await updateGame(gameId, testUser1, move1);

      const history = await getGameHistory(gameId, testUser1);
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        move: move1,
        by: testUser1._id,
        when: expect.any(Date),
      });
    });

    it('should store multiple moves in correct order', async () => {
      const game = await createGame(testUser1, 'nim', new Date());
      gameId = game._id;

      await GameModel.findByIdAndUpdate(game._id, {
        $push: { players: testUser2._id },
      });

      await GameModel.findByIdAndUpdate(game._id, {
        state: { remaining: 21, nextPlayer: 0 },
      });

      const move1 = 3;
      const move2 = 2;
      const move3 = 1;

      await updateGame(gameId, testUser1, move1);
      await updateGame(gameId, testUser2, move2);
      await updateGame(gameId, testUser1, move3);

      const history = await getGameHistory(gameId, testUser1);
      expect(history).toHaveLength(3);

      const typedHistory = history as unknown as Array<{
        move: number;
        by: Types.ObjectId;
        when: Date;
      }>;

      expect(typedHistory[0].move).toBe(move1);
      expect(typedHistory[0].by).toEqual(testUser1._id);

      expect(typedHistory[1].move).toBe(move2);
      expect(typedHistory[1].by).toEqual(testUser2._id);

      expect(typedHistory[2].move).toBe(move3);
      expect(typedHistory[2].by).toEqual(testUser1._id);
    });
  });

  describe('History Retrieval', () => {
    it('should return complete history for game participants', async () => {
      const game = await createGame(testUser1, 'nim', new Date());
      gameId = game._id;

      await GameModel.findByIdAndUpdate(game._id, {
        $push: {
          history: {
            $each: [
              { when: new Date(), by: testUser1._id, move: 3 },
              { when: new Date(), by: testUser2._id, move: 2 },
            ],
          },
        },
        $set: { players: [testUser1._id, testUser2._id] },
      });

      const history = await getGameHistory(gameId, testUser1);
      expect(history).toHaveLength(2);
    });

    it('should reject history access for non-participants', async () => {
      const game = await createGame(testUser1, 'nim', new Date());
      gameId = game._id;

      await expect(getGameHistory(gameId, testUser2)).rejects.toThrow('not a player in this game');
    });

    it('should retrieve specific move by index', async () => {
      const game = await createGame(testUser1, 'nim', new Date());
      gameId = game._id;

      const testMoves = [
        { when: new Date(), by: testUser1._id, move: 3 },
        { when: new Date(), by: testUser2._id, move: 2 },
        { when: new Date(), by: testUser1._id, move: 1 },
      ];

      await GameModel.findByIdAndUpdate(game._id, {
        $push: { history: { $each: testMoves } },
        $set: { players: [testUser1._id, testUser2._id] },
      });

      for (let i = 0; i < testMoves.length; i += 1) {
        const move = await getGameHistoryMove(gameId, i, testUser1);
        expect(move).toEqual(testMoves[i]);
      }
    });

    it('should throw error for out-of-bounds history index', async () => {
      const game = await createGame(testUser1, 'nim', new Date());
      gameId = game._id;

      await expect(getGameHistoryMove(gameId, 0, testUser1)).rejects.toThrow(
        'history index out of bounds',
      );
      await expect(getGameHistoryMove(gameId, -1, testUser1)).rejects.toThrow(
        'history index out of bounds',
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid game ID', async () => {
      await expect(getGameHistory('invalid-id', testUser1)).rejects.toThrow('invalid game id');
    });

    it('should throw error for non-existent game', async () => {
      const fakeId = new Types.ObjectId().toString();
      await expect(getGameHistory(fakeId, testUser1)).rejects.toThrow('game not found');
    });
  });
});
