/* eslint no-console: "off" */

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './pages/Login.tsx';
import { AuthContext } from './contexts/LoginContext.ts';
import Layout from './components/Layout.tsx';
import Home from './pages/Home.tsx';
import ThreadList from './pages/ThreadList.tsx';
import Profile from './pages/Profile.tsx';
import { io } from 'socket.io-client';
import { StrategySocket } from './util/types.ts';
import LoggedInRoute from './components/LoggedInRoute.tsx';
import NewGame from './pages/NewGame.tsx';
import Game from './pages/Game.tsx';
import GameList from './pages/GameList.tsx';
import ThreadPage from './pages/ThreadPage.tsx';
import { ErrorBoundary } from 'react-error-boundary';
import fallback from './fallback.tsx';
import NewThread from './pages/NewThread.tsx';
import PrivateChat from './pages/PrivateChat.tsx';
/** If `true`, all incoming socket messages will be logged */
const DEBUG_SOCKETS = false;

function NoSuchRoute() {
  const { pathname } = useLocation();
  return `No page found for route '${pathname}'`;
}

export default function App() {
  const [socket, setSocket] = useState<StrategySocket | null>(null);
  const [auth, setAuth] = useState<AuthContext | null>(null);

  useEffect(() => {
    const newSocket: StrategySocket = io();
    setSocket(newSocket);
    if (DEBUG_SOCKETS) {
      newSocket.onAny((tag, payload) => {
        console.log(`from socket got ${tag}(${JSON.stringify(payload)})`);
      });
    }
    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, []);

  return (
    socket && (
      <BrowserRouter>
        <Routes>
          <Route path='/login' element={<Login setAuth={auth => setAuth(auth)} />} />
          <Route
            element={
              <LoggedInRoute auth={auth} socket={socket}>
                <ErrorBoundary fallbackRender={fallback}>
                  <Layout />
                </ErrorBoundary>
              </LoggedInRoute>
            }>
            <Route path='/' element={<Home />} />
            <Route path='/forum' element={<ThreadList />} />
            <Route path='/forum/post/new' element={<NewThread />} />
            <Route path='/forum/post/:threadId' element={<ThreadPage />} />
            <Route path='/games' element={<GameList />} />
            <Route path='/game/new' element={<NewGame />} />
            <Route path='/game/:gameId' element={<Game />} />
            <Route path='/profile/:username' element={<Profile />} />
            <Route path='/*' element={<NoSuchRoute />} />
            <Route path='/chat' element={<PrivateChat />} />
          </Route>
        </Routes>
      </BrowserRouter>
    )
  );
}
