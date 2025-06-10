import { GameKey, TaggedGameView } from '@strategy-town/shared';

const START_NIM_OBJECTS = 21;

function buildNimViews(history: { move: number }[]): TaggedGameView[] {
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

export function buildHistoryViews(type: GameKey, history: { move: number }[]): TaggedGameView[] {
  switch (type) {
    case 'nim':
      return buildNimViews(history);
    default:
      return [];
  }
}
