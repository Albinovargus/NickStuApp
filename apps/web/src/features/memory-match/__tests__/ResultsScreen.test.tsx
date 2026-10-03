import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ResultsScreen } from '../components/ResultsScreen.js';
import { sampleGame } from './fixtures.js';

const tile = (label: string) => screen.getByText(label, { exact: true }).parentElement;

describe('ResultsScreen', () => {
  const { config, result } = sampleGame();

  it('shows the stat tiles', () => {
    render(<ResultsScreen result={result} cards={config.cards} subtitle="Shapes · Small" onPlayAgain={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Results' })).toBeInTheDocument();
    expect(screen.getByText('Shapes · Small')).toBeInTheDocument();
    expect(tile('Turns')).toHaveTextContent('8');
    expect(tile('Accuracy')).toHaveTextContent('75%');
    expect(tile('Total time')).toHaveTextContent('16.0s');
    expect(tile('Avg per turn')).toHaveTextContent('2.0s');
    expect(tile('Memory errors')).toHaveTextContent('1');
  });

  it('lists each pair in the order found', () => {
    render(<ResultsScreen result={result} cards={config.cards} onPlayAgain={vi.fn()} />);
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(6);
    expect(within(rows[0]!).getByText('Red circle')).toBeInTheDocument();
    expect(rows[1]).toHaveTextContent(/Blue circle\s*4\s*4\s*8\.0s/);
  });

  it('moves focus to the Results heading on mount', () => {
    render(<ResultsScreen result={result} cards={config.cards} onPlayAgain={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Results' })).toHaveFocus();
  });

  it('calls onPlayAgain', () => {
    const onPlayAgain = vi.fn();
    render(<ResultsScreen result={result} cards={config.cards} onPlayAgain={onPlayAgain} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play again' }));
    expect(onPlayAgain).toHaveBeenCalledOnce();
  });
});
