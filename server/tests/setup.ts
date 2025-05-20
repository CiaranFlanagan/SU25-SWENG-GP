import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, disconnect } from 'mongoose';
import { clearMongo, populateMongo } from '../src/mongo.ts';

let mongo: MongoMemoryServer | null = null;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await connect(uri);
});

beforeEach(async () => {
  await populateMongo();
});

afterEach(async () => {
  await clearMongo();
});

afterAll(async () => {
  if (mongo) {
    await disconnect();
    await mongo.stop();
  }
});
