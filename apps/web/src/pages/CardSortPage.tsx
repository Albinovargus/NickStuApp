import { useState } from 'react';
import type { WrongPlacementMode } from '@myapp/types';
import {
  CardSortBoard,
  MODE_LABELS,
  ResultsScreen,
  StartScreen,
  cardPacks,
  useCardSortSession,
} from '../features/card-sort/index.js';

export function CardSortPage() {
  const { state, start, place, reset, result } = useCardSortSession();
  // Remember the last choices so "Play again" returns to the same pack and mode.
  const [lastChoice, setLastChoice] = useState<{ packId: string; mode: WrongPlacementMode }>({
    packId: cardPacks[0]?.id ?? '',
    mode: 'accept',
  });

  if (state.status === 'finished' && result && state.config) {
    return (
      <ResultsScreen
        result={result}
        piles={state.config.piles}
        subtitle={`${state.config.name} · ${MODE_LABELS[state.config.wrongPlacement]}`}
        onPlayAgain={reset}
      />
    );
  }

  if (state.status === 'running' && state.config) {
    return <CardSortBoard config={state.config} deck={state.deck} piles={state.piles} onPlace={place} />;
  }

  return (
    <StartScreen
      packs={cardPacks}
      initialPackId={lastChoice.packId}
      initialMode={lastChoice.mode}
      onStart={(pack, mode) => {
        setLastChoice({ packId: pack.id, mode });
        start(pack.build(mode));
      }}
    />
  );
}
