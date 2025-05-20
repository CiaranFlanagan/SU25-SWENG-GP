// Run this script to launch the server.
/* eslint no-console: "off" */

import startServer from './app.ts';
import { connectMongo } from './mongo.ts';

connectMongo()
  .then(() => {
    console.log('Connected to database, starting server');
    startServer();
  })
  .catch(err => {
    console.error(`Error: ${err}`);
  });
