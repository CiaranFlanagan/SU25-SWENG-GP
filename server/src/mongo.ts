/* eslint no-console: "off" */

import { connect, Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { configDotenv } from 'dotenv';
import { UserModel } from './models/user.model.ts';
import { ThreadModel } from './models/thread.model.ts';
import { CommentModel } from './models/comment.model.ts';
import { GameModel } from './models/game.model.ts';
import { createChat } from './services/chat.service.ts';

/**
 * Clears all the data in the MongoDB models for the currently-connected Mongo
 * database. Beware!
 *
 * Requires that mongoose already be initialized with the `connect()`
 * function.
 */
export async function clearMongo() {
  await GameModel.deleteMany();
  await ThreadModel.deleteMany();
  await CommentModel.deleteMany();
  await UserModel.deleteMany();
}

/** Utility function to calculate days in the past */
const daysAgo = (n: number) => new Date(new Date().getTime() - n * 24 * 60 * 60 * 1000);

/**
 * Adds sample data to the MongoDB models. Requires that the database is
 * emptied, either because it's new or because clearMongo() was just run.
 */
export async function populateMongo() {
  const [user0, user1, user2, user3] = await UserModel.insertMany([
    {
      username: 'user0',
      password: 'pwd0',
      display: 'Strategy.town webmaster',
      createdAt: new Date('2024-11-12'),
    },
    {
      username: 'user1',
      password: 'pwd1',
      display: 'Yāo',
      createdAt: new Date('2025-01-02'),
    },
    {
      username: 'user2',
      password: 'pwd2',
      display: 'Sénior Dos',
      createdAt: new Date('2025-03-04'),
    },
    {
      username: 'user3',
      password: 'pwd3',
      display: 'Frau Drei',
      createdAt: new Date('2025-01-01'),
    },
  ]);

  await ThreadModel.insertMany([
    {
      _id: new Types.ObjectId('abadcafeabadcafeabadcafe'),
      createdBy: user1,
      createdAt: new Date(),
      title: 'Nim?',
      text: "Is anyone around that wants to play Nim? I'll be here for the next hour or so.",
      comments: [],
    },
    {
      _id: new Types.ObjectId('deadbeefdeadbeefdeadbeef'),
      createdBy: user1,
      createdAt: new Date('2025-04-02'),
      title: 'Hello strategy townies',
      text: "I'm a big Nim buff and am excited to join this community.",
      comments: [],
    },
    {
      createdBy: user3,
      createdAt: daysAgo(6),
      title: 'Other games?',
      text: "Nim is great, but I'm hoping some new strategy games will get introduced soon.",
      comments: await CommentModel.insertMany([
        {
          createdBy: user0,
          createdAt: daysAgo(5.9),
          text: "I'm working on this, stay tuned!",
        },
        { createdBy: user3, createdAt: daysAgo(5.8), text: "Excited to see what's in store!" },
      ]),
    },
    {
      createdBy: user2,
      createdAt: new Date('2025-04-04'),
      title: 'Strategy guide?',
      text: "I'm pretty confused about the right strategy for Nim, is there anyone around who can help explain this?",
      comments: [],
    },
    {
      createdBy: user0,
      createdAt: daysAgo(1.5),
      title: 'New game: multiplayer number guesser!',
      text: 'Strategy.town now has an exciting new game: guess! Try it out today: multiple people can join this exciting game, and guess a number between 1 and 100!',
      comments: await CommentModel.insertMany([
        { createdBy: user3, createdAt: daysAgo(0.8), text: 'Exciting' },
      ]),
    },
  ]);

  await GameModel.insertMany([
    {
      type: 'nim',
      state: { remaining: 0, nextPlayer: 1 },
      done: true,
      chat: (await createChat(new Date('2025-04-21')))._id,
      players: [user2, user3],
      createdAt: new Date('2025-04-21'),
      createdBy: user2,
    },
    {
      type: 'guess',
      state: { secret: 43, guesses: [null, 2, 99, null] },
      done: false,
      chat: (await createChat(daysAgo(0.2)))._id,
      players: [user1, user0, user3, user2],
      createdAt: daysAgo(0.2),
      createdBy: user1,
    },
    {
      type: 'nim',
      done: false,
      chat: (await createChat(new Date()))._id,
      players: [user1],
      createdAt: new Date(),
      createdBy: user1,
    },
  ]);
}

interface ConnectMongoProps {
  MONGODB_CONNECTION_STRING?: string;
  MONGODB_DB_NAME?: string;
  MONGODB_RESET?: 'if_no_users' | 'always' | 'never';
}

/**
 * Sets up the mongo database. Configuration variables passed to the function
 * will take precedence over environment variables.
 * @param props
 *  - `MONGODB_CONNECTION_STRING` is the connection string for mongodb (default `mongodb://127.0.0.1:27017/`)
 *  - `MONGODB_DB_NAME` is the database name (default `strategy_town_app`)
 *  - `MONGODB_RESET` determines when this function will wipe the database and replace it with sample data
 *    - `"always"` means it will always wipe add sample data
 *    - `"never"` means it will never delete or add, just connect
 *    - `"if_no_users"` means it will only wipe the database and add sample data if there are no users
 */
export async function connectMongo(props: ConnectMongoProps = {}) {
  async function getMemoryMongo() {
    const mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    console.log(
      `MONGODB_CONNECTION_STRING not specified, created temporary in-memory mongo server at ${uri}`,
    );
    return uri;
  }

  configDotenv();

  await connect(
    props.MONGODB_CONNECTION_STRING ??
      process.env.MONGODB_CONNECTION_STRING ??
      (await getMemoryMongo()),
    { dbName: props.MONGODB_DB_NAME ?? process.env.MONGODB_DB_NAME ?? 'strategy_town_app' },
  );

  const dbReset = props.MONGODB_RESET ?? process.env.MONGODB_RESET ?? 'if_no_users';
  if (dbReset === 'if_no_users') {
    const connections = await UserModel.find();
    if (connections.length > 0) return;
  } else if (dbReset !== 'always') {
    return;
  }
  await clearMongo();
  await populateMongo();
}
