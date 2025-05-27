import { type GameInfo, type GameKey, type TaggedGameView } from '@strategy-town/shared';
import { createChat } from './chat.service.ts';
import { populateSafeUserInfo } from './user.service.ts';
import { type GameServicer } from '../games/gameServiceManager.ts';
import { nimGameService } from '../games/nim.ts';
import { guessGameService } from '../games/guess.ts';
import { type GameViewUpdates, type UserWithId } from '../types.ts';
import { isValidObjectId, Types } from 'mongoose';
import { type GameInfoIsh, GameModel, populateArgsForGameInfoIsh } from '../models/game.model.ts';

/**
 * The service interface for individual games
 */
export const gameServices: { [key in GameKey]: GameServicer } = {
  nim: nimGameService,
  guess: guessGameService,
};

/**
 * Do the first projection of a game model from the database
 *
 * @param _id - A game id
 * @returns a populated Mongoose document, or null if the id is not in the database
 */
async function findGameInfoIsh(_id: Types.ObjectId) {
  return await GameModel.findById(_id)
    .select(populateArgsForGameInfoIsh.select)
    .populate<GameInfoIsh>(populateArgsForGameInfoIsh.populate);
}

/**
 * Mongoose can only give us an approximately-correct GameInfo, so this
 * function cleans it up into a proper GameInfo.
 *
 * The TypeScript type returned by findGameInfoIsh is quite complex, so the
 * TypeScript magic in the type annotation can be read as: "take whatever
 * type you get out of a findGameInfoIsh() and both await it and assume that
 * it cannot be null.
 *
 * @param game - The result of finding a Game and populating it by populateArgsForGameInfoIsh
 * @returns A correctly structured GameInfo
 */
function cleanUpGameInfo(game: NonNullable<Awaited<ReturnType<typeof findGameInfoIsh>>>): GameInfo {
  return {
    _id: game._id.toString(),
    type: game.type,
    status: !game.state ? 'waiting' : game.done ? 'done' : 'active',
    chat: game.chat,
    players: game.players,
    createdAt: game.createdAt,
    createdBy: game.createdBy,
    minPlayers: gameServices[game.type].minPlayers,
  };
}

/**
 * Expand a stored game
 *
 * @param _id - Valid game id
 * @returns the expanded game info object
 */
async function populateGameInfo(_id: Types.ObjectId): Promise<GameInfo> {
  const game = await findGameInfoIsh(_id);
  // The type assertion are justified by the precondition that this is a valid id
  return cleanUpGameInfo(game!);
}

/**
 * Create and store a new game
 *
 * @param user - Initial player in the game's waiting room
 * @param type - Game key
 * @param createdAt - Creation time for this game
 * @returns the new game's info object
 */
export async function createGame(
  user: UserWithId,
  type: GameKey,
  createdAt: Date,
): Promise<GameInfo> {
  const chat = await createChat(createdAt);
  const game = await GameModel.insertOne({
    type,
    done: false,
    chat: chat._id,
    createdAt,
    createdBy: user._id,
    players: [user._id],
    history: [],
  });

  return populateGameInfo(game._id);
}

/**
 * Retrieves a single game from the database. If you expect the id to be valid, use `forceGameById`.
 *
 * @param gameId - Ostensible game id
 * @returns the game's info object, or null
 */
export async function getGameById(gameId: string): Promise<GameInfo | null> {
  if (!isValidObjectId(gameId)) return null;
  const game = await GameModel.findById(new Types.ObjectId(gameId));
  if (!game) return null;
  return await populateGameInfo(game._id);
}

/**
 * Adds a user to a game that hasn't started yet. If the resulting game object has the maximum
 * allowed number of players, it is the responsibility of the caller to start the game.
 *
 * @param gameId - Ostensible game id
 * @param user - Authenticated user
 * @returns the game's info object, with the `user` listed among the players
 * @throws if the game id is not valid, if the game has started, or if the game cannot accept more
 * players
 */
export async function joinGame(gameId: string, user: UserWithId): Promise<GameInfo> {
  if (!isValidObjectId(gameId)) throw new Error(`user ${user.username} joining invalid game`);
  const game = await GameModel.findById(new Types.ObjectId(gameId));
  if (!game) throw new Error(`user ${user.username} joining invalid game`);
  if (game.state) {
    throw new Error(`user ${user.username} joining game that started`);
  }
  if (game.players.some(_id => _id.equals(user._id))) {
    throw new Error(`user ${user.username} joining game they are in already`);
  }
  // Type assertion is okay as long as we only store valid GameKeys in database
  if (game.players.length === gameServices[game.type as GameKey].maxPlayers) {
    throw new Error(`user ${user.username} joining full`);
  }

  game.players = [...game.players, user._id];
  await game.save();

  return await populateGameInfo(game._id);
}

/**
 * Initializes a game that hasn't started yet
 *
 * @param gameId - Ostensible game id
 * @param user - Authenticated user
 * @returns the necessary views for everyone watching the game
 * @throws if the game id is not valid, if the game already started, or if the game lacks enough
 * players to start
 */
export async function startGame(gameId: string, user: UserWithId): Promise<GameViewUpdates> {
  if (!isValidObjectId(gameId)) throw new Error(`user ${user.username} starting invalid game`);
  const game = await GameModel.findById(new Types.ObjectId(gameId));
  if (!game) throw new Error(`user ${user.username} starting invalid game`);
  if (game.state) {
    throw new Error(`user ${user.username} starting game that started`);
  }

  // Type assertion is okay as long as we only store valid GameKeys in database
  const key = game.type as GameKey;

  if (game.players.length < gameServices[key].minPlayers) {
    throw new Error(`user ${user.username} starting underpopulated game`);
  }
  if (!game.players.some(_id => _id.equals(user._id))) {
    throw new Error(`user ${user.username} starting game they're not in`);
  }
  const { state, views } = gameServices[key].create(game.players);

  game.state = state;
  await game.save();

  return views;
}

/**
 * Get a list of all games
 *
 * @returns a list of game summaries, ordered reverse chronologically
 */
export async function getGames(): Promise<GameInfo[]> {
  const gamesIsh = await GameModel.find()
    .select(populateArgsForGameInfoIsh.select)
    .populate<GameInfoIsh>(populateArgsForGameInfoIsh.populate)
    .sort({ createdAt: -1 });

  return gamesIsh.map(cleanUpGameInfo);
}

/**
 * Updates a game state and returns the necessary view updates
 *
 * @param gameId - Ostensible game id
 * @param user - Authenticated user
 * @param move - Unsanitized game move
 * @returns the view updates to send to players and watchers
 * @throws if the game id or move is not valid
 */
export async function updateGame(gameId: string, user: UserWithId, move: unknown) {
  if (!isValidObjectId(gameId)) throw new Error(`user ${user.username} acting on invalid game`);
  const game = await GameModel.findById(new Types.ObjectId(gameId));
  if (!game) throw new Error(`user ${user.username} acted on an invalid game`);
  if (!game.state) {
    throw new Error(`user ${user.username} made a move in game of that hadn't started`);
  }
  const playerIndex = game.players.findIndex(_id => _id.equals(user._id));
  if (playerIndex < 0) {
    throw new Error(`user ${user.username} made a move in a game they weren't playing`);
  }
  // Type assertion is okay as long as we only store valid GameKeys in database
  const result = gameServices[game.type as GameKey].update(
    game.state,
    move,
    playerIndex,
    game.players,
  );
  if (!result) throw new Error(`user ${user.username} made an invalid move in ${game.type}`);

  game.state = result.state;
  game.done = game.done || result.done;
  await game.save();

  return result.views;
}

/**
 * View a game as a specific user
 * @param gameId - Ostensible game id
 * @param user - Authenticated user
 * @returns A boolean for whether that user is a player, the player's view, and the list of players
 */
export async function viewGame(gameId: string, user: UserWithId) {
  if (!isValidObjectId(gameId)) throw new Error(`user ${user.username} viewed on invalid game id`);
  const game = await GameModel.findById(new Types.ObjectId(gameId));
  if (!game) throw new Error(`user ${user.username} viewed an invalid game id`);
  const playerIndex = game.players.findIndex(({ _id }) => _id.equals(user._id));
  let view: TaggedGameView | null = null;
  if (game.state) {
    // Type assertion is okay as long as we only store valid GameKeys in database
    view = gameServices[game.type as GameKey].view(game.state, playerIndex);
  }
  return {
    isPlayer: playerIndex >= 0,
    view,
    players: await Promise.all(game.players.map(populateSafeUserInfo)),
  };
}
