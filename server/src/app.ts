/* eslint no-console: "off" */

import express, { Router } from 'express';
import * as http from 'node:http';
import * as chat from './controllers/chat.controller.ts';
import * as game from './controllers/game.controller.ts';
import * as thread from './controllers/thread.controller.ts';
import * as comment from './controllers/comment.controller.ts';
import * as user from './controllers/user.controller.ts';
import { type StrategyServer } from './types.ts';
import { Server } from 'socket.io';
import * as path from 'node:path';

const PORT = parseInt(process.env.PORT || '8000');
export const app = express();
const httpSever = http.createServer(app);
const io: StrategyServer = new Server(httpSever);

app.use(express.json());

app.use(
  '/api',
  Router()
    .use(
      '/game',
      express
        .Router() //
        .post('/create', game.postCreate)
        .get('/list', game.getList)
        .post('/:id/history/:index', game.getHistoryAt)
        .post('/:id/history', game.getHistory)
        .get('/:id', game.getById),
    )
    .use(
      '/thread',
      express
        .Router() //
        .post('/create', thread.postCreate)
        .get('/list', thread.getList)
        .get('/:id', thread.getById)
        .post('/:id/comment', thread.postByIdComment)
        .post('/:id/vote', thread.postByIdVote)
        .delete('/:id/vote', thread.deleteByIdVote),
    )
    .use(
      '/user',
      Router() // Any concrete routes here should be disallowed as usernames
        .post('/list', user.postList)
        .post('/login', user.postLogin)
        .post('/signup', user.postSignup)
        .post('/:username', user.postByUsername)
        .get('/:username', user.getByUsername),
    )
    .use(
      '/comment',
      express
        .Router()
        .get('/list', comment.getList)
        .get('/:id', comment.getById)
        .post('/:id/vote', comment.postByIdVote)
        .delete('/:id/vote', comment.deleteByIdVote),
    )
    .use('/chat', express.Router().post('/private', chat.postPrivate)),
);

io.on('connection', socket => {
  const socketId = socket.id;
  console.log(`CONN [${socketId}] connected`);

  socket.on('disconnect', () => {
    console.log(`CONN [${socketId}] disconnected`);
  });

  socket.on('chatJoin', chat.socketJoin(socket, io));
  socket.on('chatLeave', chat.socketLeave(socket, io));
  socket.on('chatSendMessage', chat.socketSendMessage(socket, io));

  socket.on('gameJoinAsPlayer', game.socketJoinAsPlayer(socket, io));
  socket.on('gameMakeMove', game.socketMakeMove(socket, io));
  socket.on('gameStart', game.socketStart(socket, io));
  socket.on('gameWatch', game.socketWatch(socket, io));

  socket.onAny((name, payload) => {
    console.log(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      `RECV [${socketId}] got ${name}${'auth' in payload ? ` from ${payload.auth.username}` : ''} ${'payload' in payload ? JSON.stringify(payload.payload) : ''}`,
    );
  });
  socket.onAnyOutgoing(name => {
    console.log(`SEND [${socketId}] gets ${name}`);
  });
});

export default function startServer() {
  httpSever.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

if (process.env.MODE === 'production') {
  app.use(express.static(path.join(import.meta.dirname, '../../client/dist')));
  app.get(/(.*)/, (req, res) =>
    res.sendFile(path.join(import.meta.dirname, '../../client/dist/index.html')),
  );
} else {
  app.get('/', (req, res) => {
    res.send(
      'You are connecting directly to the API server in development mode! ' +
        'You probably want to look elsewhere for the Vite frontend.',
    );
    res.end();
  });
}
