import './GameSummaryView.css';
import { GameInfo } from '@strategy-town/shared';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameNames } from '../util/consts.ts';

/**
 * Summarizes information for a single game as part of a list of games
 */
export default function GameSummaryView({
  _id,
  status,
  type,
  players,
  createdAt,
  createdBy,
}: GameInfo) {
  const navigate = useNavigate();
  const [now] = useState(new Date());
  const numPlayers = players.length;
  return (
    <div className='gameSummary' onClick={() => navigate(`/game/${_id}`)}>
      <div className='stats'>
        {status}
        {status !== 'done' && `, ${numPlayers} player${numPlayers === 1 ? '' : 's'}`}
      </div>
      <div className='mid'>A game of {gameNames[type]}</div>
      <div className='lastActivity'>
        {createdBy.display} created {dayjs(createdAt).from(now)}
      </div>
    </div>
  );
}
