import { zGuessMove, type GuessView } from '@strategy-town/shared';
import { GameService } from './gameServiceManager.ts';
import { type GameLogic } from './gameLogic.ts';

interface GuessState {
  secret: number;
  guesses: (number | null)[];
}

function allGuessed(guesses: (number | null)[]): guesses is number[] {
  return guesses.every(guess => guess !== null);
}

export const guessLogic: GameLogic<GuessState, GuessView> = {
  minPlayers: 2,
  maxPlayers: null,
  start: numPlayers => ({
    secret: Math.round(Math.random() * 100) + 1,
    guesses: Array.from({ length: numPlayers }).map(() => null),
  }),
  update: ({ secret, guesses: oldGuesses }, payload, playerIndex) => {
    const move = zGuessMove.safeParse(payload);
    if (oldGuesses[playerIndex] !== null) return null;
    if (move.error) return null;
    const newGuesses = [...oldGuesses];
    newGuesses[playerIndex] = move.data;
    return {
      secret,
      guesses: newGuesses,
    };
  },
  isDone: ({ guesses }) => guesses.every(guess => guess !== null),
  viewAs: ({ secret, guesses }, playerIndex) => {
    if (allGuessed(guesses)) {
      return { secret, guesses };
    }
    // If the game is not done, we only show the player their own guess
    // everyone can see *who* has guessed
    return {
      guesses: guesses.map((value, index) => {
        if (value === null) return false;
        if (index === playerIndex) return value;
        return true;
      }),
    };
  },
  tagView: view => ({ type: 'guess', view }),
};

export const guessGameService = new GameService<GuessState, GuessView>(guessLogic);
