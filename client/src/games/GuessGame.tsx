import { GuessMove, GuessView } from '@strategy-town/shared';
import { GameProps } from '../util/types.ts';
import { useState } from 'react';

export default function GuessGame({
  view: { secret, guesses },
  players,
  userPlayerIndex,
  makeMove,
}: GameProps<GuessView, GuessMove>) {
  const [guess, setGuess] = useState(16);
  const playerHasGuessed = guesses[userPlayerIndex] !== false;
  const gameIsUnfinished = !secret;

  // type assertion is safe because guesses are only boolean-valued before the secret is revealed
  const bestDelta = !secret
    ? null
    : Math.min(...guesses.map(guess => Math.abs((guess as number) - secret)));

  /** Checks if a best is the best guess */
  function isBestGuess(guess: number | boolean) {
    return secret && typeof guess === 'number' && bestDelta === Math.abs(guess - secret);
  }

  /** Get the response text for a specific player's guess */
  function getGuessText(guess: boolean | number, index: number) {
    if (index === userPlayerIndex) {
      return !guess ? "You haven't guessed yet" : `You guessed ${guess}`;
    }
    if (guess === false) {
      return `${players[index].display} hasn't guessed yet`;
    }
    if (guess === true) {
      return `${players[index].display} has guessed`;
    }
    return `${players[index].display} guessed ${guess}`;
  }

  return (
    <div className='content spacedSection'>
      <div>In the guessing game, players guess a number between 1 and 100. The closest wins!</div>
      <ul>
        {guesses.map((guess, index) => (
          <li key={index}>
            {getGuessText(guess, index)}
            {isBestGuess(guess) && ' 👑'}
          </li>
        ))}
      </ul>
      <hr />
      {!gameIsUnfinished && `Game over! The secret was ${secret}`}
      {gameIsUnfinished &&
        userPlayerIndex >= 0 &&
        (playerHasGuessed ? (
          <>Waiting for other players...</>
        ) : (
          <form
            onSubmit={e => {
              e.preventDefault();
              makeMove(guess);
            }}>
            <div>Guess a number between 1 and 100!</div>
            <input
              type='range'
              value={guess}
              min={1}
              max={100}
              step={1}
              onChange={e => setGuess(parseInt(e.target.value))}
            />
            <div>Ready to guess {guess}?</div>
            <button className='primary narrow'>Submit</button>
          </form>
        ))}
    </div>
  );
}
