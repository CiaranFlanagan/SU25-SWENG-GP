import './GamePanel.css';
import { GameInfo } from '@strategy-town/shared';
import { gameNames } from '../util/consts.ts';
import useLoginContext from '../hooks/useLoginContext.ts';
import dayjs from 'dayjs';
import GameDispatch from '../games/GameDispatch.tsx';
import useSocketsForGame from '../hooks/useSocketsForGame.ts';
import { useEffect, useState } from 'react';
import { getGameHistory } from '../services/gameService.ts';

/**
 * A game panel allows viewing the status and players of a live game
 */
export default function GamePanel({
  _id,
  type,
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
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1); // -1 means current state
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const isDone = true; //gonna figure this out later

  // fetching game History when isDone is true
  useEffect(() => {
    if (isDone && userPlayerIndex >= 0) {
      const fetchHistory = async () => {
        try {
          const response = await getGameHistory(_id);
          if ('error' in response) return;
          setGameHistory(response);
        } catch (error) {
          return;
        }
      };
      fetchHistory();
    }
  }, [_id, isDone, userPlayerIndex]);

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

  //game state of whether viewing history or playing game, will do late also
  // const gameStateToShow =
  //   isViewingHistory && gameHistory[currentHistoryIndex] ? gameHistory[currentHistoryIndex] : view;

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
      {isDone /* && gameHistory.length > 0 */ && ( //dealing with gameHistory.length later
        <div className='historyControls'>
          <div className='gameFinishedHeader'>
            <strong>Game Finished - Review History</strong>
          </div>
          <div className='smallAndGray'>
            {isViewingHistory
              ? `Viewing move ${currentHistoryIndex + 1} of ${gameHistory.length}`
              : 'Final game state'}
          </div>
          <div className='historyButtons'>
            <button
              className='secondary narrow'
              onClick={handlePrevMove}
              disabled={isViewingHistory && currentHistoryIndex === 0}>
              ← Prev
            </button>
            <button className='secondary narrow' onClick={handleNextMove}>
              {isViewingHistory && currentHistoryIndex < gameHistory.length - 1
                ? 'Next →'
                : 'Final →'}
            </button>
            {isViewingHistory && (
              <button className='primary narrow' onClick={handleBackToCurrent}>
                Back to Final
              </button>
            )}
          </div>
        </div>
      )}
      {view ? (
        <div className='gameFrame'>
          <GameDispatch
            gameId={_id}
            userPlayerIndex={userPlayerIndex}
            players={players}
            view={view} //implementing later of viewing game history instead
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
