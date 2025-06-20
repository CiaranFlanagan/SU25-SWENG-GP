import './GamePanel.css';
import { GameInfo, TaggedGameView } from '@strategy-town/shared';
import { gameNames } from '../util/consts.ts';
import useLoginContext from '../hooks/useLoginContext.ts';
import dayjs from 'dayjs';
import GameDispatch from '../games/GameDispatch.tsx';
import useSocketsForGame from '../hooks/useSocketsForGame.ts';
import { useEffect, useState } from 'react';
import { getGameHistory } from '../services/gameService.ts';
import useAuth from '../hooks/useAuth.ts';
import UserLink from './UserLink.tsx';
import { buildHistoryViews } from '../games/replay.ts';

function isGameCompleteFromView(view: TaggedGameView | null): boolean {
  if (!view) return false;

  switch (view.type) {
    case 'nim':
      return view.view.remaining === 0;
    case 'guess':
      // For guess game, check if secret is revealed (only happens when all players have guessed)
      return 'secret' in view.view && view.view.secret !== undefined;
    default:
      return false;
  }
}

/**
 * A game panel allows viewing the status and players of a live game
 */
export default function GamePanel({
  _id,
  type,
  status,
  players: initialPlayers,
  createdAt,
  minPlayers,
}: GameInfo) {
  const { user } = useLoginContext();
  const auth = useAuth();

  const { view, players, userPlayerIndex, hasWatched, joinGame, startGame } = useSocketsForGame(
    _id,
    initialPlayers,
  );

  const [gameHistory, setGameHistory] = useState<unknown[]>([]);
  const [historyViews, setHistoryViews] = useState<TaggedGameView[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1); // -1 means current state
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const isDone = status === 'done' || isGameCompleteFromView(view);

  // fetching game History when isDone is true
  useEffect(() => {
    if (isDone && userPlayerIndex >= 0) {
      const fetchHistory = async () => {
        try {
          const response = await getGameHistory(_id, auth);
          if ('error' in response) return;
          console.log('Game history response:', response);
          setGameHistory(response);
          const views = buildHistoryViews(type, response as { move: unknown }[]);
          console.log('Built history views:', views);
          setHistoryViews(views);
        } catch (error) {
          return;
        }
      };
      fetchHistory();
    }
  }, [_id, isDone, userPlayerIndex, type, auth]);

  useEffect(() => {
    if (gameHistory.length > 0) {
      setHistoryViews(buildHistoryViews(type, gameHistory as { move: unknown }[]));
    }
  }, [gameHistory, type]);

  // going to the previous move in history
  const handlePrevMove = () => {
    if (historyViews.length === 0) return;

    const newIndex = isViewingHistory
      ? Math.max(0, currentHistoryIndex - 1)
      : historyViews.length - 1;

    setCurrentHistoryIndex(newIndex);
    setIsViewingHistory(true);
  };

  // going to the next move in history
  const handleNextMove = () => {
    if (historyViews.length === 0) return;

    if (currentHistoryIndex >= historyViews.length - 1) {
      // Go back to current state
      setIsViewingHistory(false);
      setCurrentHistoryIndex(-1);
    } else {
      setCurrentHistoryIndex(currentHistoryIndex + 1);
    }
  };

  //the final move
  const handleBackToCurrent = () => {
    setIsViewingHistory(false);
    setCurrentHistoryIndex(-1);
  };

  const gameStateToShow: TaggedGameView | null =
    isViewingHistory && historyViews[currentHistoryIndex]
      ? historyViews[currentHistoryIndex]
      : view;

  return hasWatched ? (
    <div className='gamePanel'>
      <div className='gameRoster'>
        <h2>{gameNames[type]}</h2>
        <div className='smallAndGray'>Game room created {dayjs(createdAt).fromNow()}</div>
        <div className='dottedList'>
          {players.map((player, index) => (
            <div className='dottedListItem' key={player.username}>
              {player.username === user.username ? (
                `you are player #${index + 1}`
              ) : (
                <span>
                  Player #{index + 1} is{' '}
                  <UserLink username={player.username} displayName={player.display} />
                </span>
              )}
            </div>
          ))}
        </div>
        {
          // If the game hasn't started and user hasn't joined, they can join
          userPlayerIndex < 0 && !view && (
            <button className='primary narrow' onClick={joinGame}>
              Join Game
            </button>
          )
        }
        {
          // If the game hasn't started and the user has joined, they can start the game if a minimum number of players are present
          userPlayerIndex >= 0 && !view && players.length >= minPlayers && (
            <button className='primary narrow' onClick={startGame}>
              Start Game
            </button>
          )
        }
      </div>
      {/* 1) if the game is done but we’re not yet in replay mode… */}
      {isDone && userPlayerIndex >= 0 && !isViewingHistory && (
        <button
          className='primary narrow'
          onClick={() => {
            // jump to the last move and flip into “replay” UI
            setCurrentHistoryIndex(historyViews.length - 1);
            setIsViewingHistory(true);
          }}>
          Replay moves
        </button>
      )}
      {/* 2) once isViewingHistory === true, show your full Prev/Next controls */}
      {isDone && userPlayerIndex >= 0 && isViewingHistory && (
        <div className='historyControls'>
          <div className='gameFinishedHeader'>
            <strong>Game Finished – Review History</strong>
          </div>
          <div className='smallAndGray'>
            Viewing move {currentHistoryIndex + 1} of {historyViews.length}
          </div>
          <div className='historyButtons'>
            <button
              className='secondary narrow'
              onClick={handlePrevMove}
              disabled={currentHistoryIndex === 0}>
              ← Prev
            </button>
            <button className='secondary narrow' onClick={handleNextMove}>
              {currentHistoryIndex < historyViews.length - 1 ? 'Next →' : 'Final →'}
            </button>
            <button className='primary narrow' onClick={handleBackToCurrent}>
              Back to Final
            </button>
          </div>
        </div>
      )}
      {view && gameStateToShow ? (
        <div className='gameFrame'>
          <GameDispatch
            gameId={_id}
            userPlayerIndex={userPlayerIndex}
            players={players}
            view={gameStateToShow}
            isViewingHistory={isViewingHistory}
          />
        </div>
      ) : (
        <div className='gameFrame waiting content'>waiting for game to begin</div>
      )}
    </div>
  ) : (
    <div></div>
  );
}
