import {
  CardSortBoard,
  ResultsScreen,
  StartScreen,
  basicShapesConfig,
  useCardSortSession,
} from '../features/card-sort/index.js';

export function CardSortPage() {
  const { state, start, place, reset, result } = useCardSortSession();

  if (state.status === 'finished' && result && state.config) {
    return <ResultsScreen result={result} piles={state.config.piles} onPlayAgain={reset} />;
  }

  if (state.status === 'running' && state.config) {
    return <CardSortBoard config={state.config} deck={state.deck} piles={state.piles} onPlace={place} />;
  }

  return <StartScreen onStart={(mode) => start(basicShapesConfig(mode))} />;
}
