import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import type { CardSortResult } from '@myapp/types';
import { ResultsScreen } from '../components/ResultsScreen.js';
import { basicShapesConfig } from '../configs/basic-shapes.js';

const { piles } = basicShapesConfig('accept');

const result: CardSortResult = {
  configId: 'basic-shapes',
  wrongPlacement: 'accept',
  cardCount: 2,
  startedAt: '2026-10-02T12:00:00.000Z',
  durationMs: 4000,
  placements: [
    { cardId: 'circle-1', pileId: 'pile-circle', correct: true, attempt: 1, atMs: 1500 },
    { cardId: 'star-1', pileId: 'pile-square', correct: false, attempt: 1, atMs: 4000 },
  ],
};

describe('ResultsScreen', () => {
  it('shows the summary stats', () => {
    render(<ResultsScreen result={result} piles={piles} onPlayAgain={() => {}} />);
    const tile = (label: string) => screen.getByText(label).parentElement;
    expect(tile('First-try accuracy')).toHaveTextContent('50%');
    expect(tile('Total time')).toHaveTextContent('4.0s');
    expect(tile('Avg per card')).toHaveTextContent('2.0s');
    expect(tile('Wrong drops')).toHaveTextContent('1');
  });

  it('shows a row per pile with dashes for empty piles', () => {
    render(<ResultsScreen result={result} piles={piles} onPlayAgain={() => {}} />);
    const circles = screen.getByRole('row', { name: /Circles/ });
    expect(within(circles).getByText('100%')).toBeInTheDocument();
    const squares = screen.getByRole('row', { name: /Squares/ });
    expect(within(squares).getByText('0%')).toBeInTheDocument();
    const triangles = screen.getByRole('row', { name: /Triangles/ });
    expect(within(triangles).getAllByText('—')).toHaveLength(2);
  });

  it('calls onPlayAgain', () => {
    const onPlayAgain = vi.fn();
    render(<ResultsScreen result={result} piles={piles} onPlayAgain={onPlayAgain} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play again' }));
    expect(onPlayAgain).toHaveBeenCalledOnce();
  });
});
