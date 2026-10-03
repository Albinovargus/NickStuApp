import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SHAPE_CARDS } from '../../cards/index.js';
import { MemoryBoard } from '../components/MemoryBoard.js';
import { makeConfig } from './fixtures.js';

const config = makeConfig(SHAPE_CARDS.slice(0, 3));
const order = config.cards.map((c) => c.id);

describe('MemoryBoard', () => {
  it('labels cards by state and shows progress', () => {
    render(
      <MemoryBoard
        config={config}
        order={order}
        faceUp={['circle-2-a']}
        matched={['circle-1-a', 'circle-1-b']}
        turns={1}
        onFlip={vi.fn()}
      />,
    );
    expect(screen.getByText('Pairs 1 / 3 · Turns 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Card 1, Red circle, matched' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Card 3, Blue circle' })).toHaveAttribute('data-state', 'up');
    expect(screen.getByRole('button', { name: 'Card 4, face down' })).toHaveAttribute('data-state', 'down');
  });

  it('flips a card on click', () => {
    const onFlip = vi.fn();
    render(<MemoryBoard config={config} order={order} faceUp={[]} matched={[]} turns={0} onFlip={onFlip} />);
    fireEvent.click(screen.getByRole('button', { name: 'Card 5, face down' }));
    expect(onFlip).toHaveBeenCalledWith('circle-3-a');
  });

  it('shakes both cards of a showing mismatch', () => {
    render(
      <MemoryBoard config={config} order={order} faceUp={['circle-1-a', 'circle-2-a']} matched={[]} turns={1} onFlip={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Card 1, Red circle' })).toHaveClass('animate-shake');
    expect(screen.getByRole('button', { name: 'Card 3, Blue circle' })).toHaveClass('animate-shake');
    expect(screen.getByRole('button', { name: 'Card 2, face down' })).not.toHaveClass('animate-shake');
  });
});
