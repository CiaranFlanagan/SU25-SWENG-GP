import { GameKey, TaggedGameView } from '@strategy-town/shared';

const START_NIM_OBJECTS = 21;

function buildNimViews(history: { move: unknown }[]): TaggedGameView[] {
  const views: TaggedGameView[] = [];
  let remaining = START_NIM_OBJECTS;
  let nextPlayer = 0;

  for (const entry of history) {
    const move = typeof entry?.move === 'number' ? entry.move : 0;
    remaining -= move;
    nextPlayer = nextPlayer === 0 ? 1 : 0;
    views.push({ type: 'nim', view: { remaining, nextPlayer } });
  }

  return views;
}

function buildGuessViews(history: { move: unknown }[]): TaggedGameView[] {
  const views: TaggedGameView[] = [];
  const guesses: (number | null)[] = new Array<number | null>(history.length).fill(null);

  for (let i = 0; i < history.length; i += 1) {
    const entry = history[i];
    const move = typeof entry?.move === 'number' ? entry.move : 0;
    guesses[i] = move;

    // Create view showing progression of guesses
    // For replay, we can show all guesses as they come in
    const currentGuesses = [...guesses];

    views.push({
      type: 'guess',
      view: {
        guesses: currentGuesses.map((guess, idx) => (idx <= i && guess !== null ? guess : false)),
      },
    });
  }

  return views;
}

export function buildHistoryViews(type: GameKey, history: { move: unknown }[]): TaggedGameView[] {
  switch (type) {
    case 'nim':
      return buildNimViews(history);
    case 'guess':
      return buildGuessViews(history);
    default:
      return [];
  }
}
