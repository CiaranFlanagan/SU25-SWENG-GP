import './GamePanel.css';
import { GameInfo, TaggedGameView } from '@strategy-town/shared';
import { gameNames } from '../util/consts.ts';
import useLoginContext from '../hooks/useLoginContext.ts';
import dayjs from 'dayjs';
import GameDispatch from '../games/GameDispatch.tsx';
import useSocketsForGame from '../hooks/useSocketsForGame.ts';
import { useEffect, useState } from 'react';
import { getGameHistory } from '../services/gameService.ts';
import { buildHistoryViews } from '../games/replay.ts';

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

  const { view, players, userPlayerIndex, hasWatched, joinGame, startGame } = useSocketsForGame(
    _id,
    initialPlayers,
  );

  const [gameHistory, setGameHistory] = useState<unknown[]>([]);
  const [historyViews, setHistoryViews] = useState<TaggedGameView[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1); // -1 means current state
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const isDone = status === 'done';

  // fetching game History when isDone is true
  useEffect(() => {
    if (isDone && userPlayerIndex >= 0) {
      const fetchHistory = async () => {
        try {
          const response = await getGameHistory(_id);
          if ('error' in response) return;
          setGameHistory(response);
          setHistoryViews(buildHistoryViews(type, response as { move: number }[]));
        } catch (error) {
          return;
        }
      };
      fetchHistory();
    }
  }, [_id, isDone, userPlayerIndex, type]);

  useEffect(() => {
    if (gameHistory.length > 0) {
      setHistoryViews(buildHistoryViews(type, gameHistory as { move: number }[]));
    }
  }, [gameHistory, type]);

  // going to the previous move in history
  const handlePrevMove = () => {
    if (gameHistory.length === 0) return;

    const newIndex = isViewingHistory
      ? Math.max(0, currentHistoryIndex - 1)
      : gameHistory.length - 1;

    setCurrentHistoryIndex(newIndex);
    setIsViewingHistory(true);
  };

  // going to the next move in history
  const handleNextMove = () => {
    if (gameHistory.length === 0) return;

    if (currentHistoryIndex >= gameHistory.length - 1) {
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
              {player.username === user.username
                ? `you are player #${index + 1}`
                : `Player #${index + 1} is ${player.display}`}
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
            setCurrentHistoryIndex(gameHistory.length - 1);
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
            Viewing move {currentHistoryIndex + 1} of {gameHistory.length}
          </div>
          <div className='historyButtons'>
            <button
              className='secondary narrow'
              onClick={handlePrevMove}
              disabled={currentHistoryIndex === 0}>
              ← Prev
            </button>
            <button className='secondary narrow' onClick={handleNextMove}>
              {currentHistoryIndex < gameHistory.length - 1 ? 'Next →' : 'Final →'}
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
