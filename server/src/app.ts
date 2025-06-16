/* eslint no-console: "off" */

import express, { Router, type Request, type Response } from 'express';
import * as http from 'node:http';
import * as path from 'node:path';
import * as chat from './controllers/chat.controller.ts';
import * as game from './controllers/game.controller.ts';
import * as thread from './controllers/thread.controller.ts';
import * as comment from './controllers/comment.controller.ts';
import * as user from './controllers/user.controller.ts';
import { type StrategyServer } from './types.ts';
import { Server } from 'socket.io';

const PORT = parseInt(process.env.PORT || '8000');
export const app = express();
const httpSever = http.createServer(app);
const io: StrategyServer = new Server(httpSever);

app.use(express.json());

// Serve static files from client build
const clientDistPath = path.join(process.cwd(), '..', 'client', 'dist');
app.use(express.static(clientDistPath));

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
  httpSever.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Health check endpoint for Railway
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Strategy Town API Server',
    mode: process.env.MODE || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Serve React app for all non-API routes
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});
