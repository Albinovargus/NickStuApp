import { useState } from 'react';
import type { MemoryBoardSize } from '@myapp/types';
import {
  BOARD_SIZES,
  MemoryBoard,
  ResultsScreen,
  StartScreen,
  buildMemoryConfig,
  memoryPacks,
  useMemoryMatchSession,
} from '../features/memory-match/index.js';

export function MemoryMatchPage() {
  const { state, start, flip, reset, result } = useMemoryMatchSession();
  // Remember the last choices so "Play again" returns to the same pack and board size.
  const [lastChoice, setLastChoice] = useState<{ packId: string; boardSize: MemoryBoardSize }>({
    packId: memoryPacks[0]?.id ?? '',
    boardSize: 'medium',
  });

  if (state.status === 'finished' && result && state.config) {
    return (
      <ResultsScreen
        result={result}
        cards={state.config.cards}
        subtitle={`${state.config.name} · ${BOARD_SIZES[state.config.boardSize].label}`}
        onPlayAgain={reset}
      />
    );
  }

  if (state.status === 'running' && state.config) {
    return (
      <MemoryBoard
        config={state.config}
        order={state.order}
        faceUp={state.faceUp}
        matched={state.matched}
        turns={Math.floor(state.flips.length / 2)}
        onFlip={flip}
      />
    );
  }

  return (
    <StartScreen
      packs={memoryPacks}
      initialPackId={lastChoice.packId}
      initialBoardSize={lastChoice.boardSize}
      onStart={(pack, boardSize) => {
        setLastChoice({ packId: pack.id, boardSize });
        start(buildMemoryConfig(pack, boardSize));
      }}
    />
  );
}
