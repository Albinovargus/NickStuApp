import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { StartScreen } from '../components/StartScreen.js';
import { memoryPacks } from '../configs/packs.js';

describe('StartScreen', () => {
  it('gives board size tabs a readable accessible name and selects the initial size', () => {
    render(<StartScreen packs={memoryPacks} initialPackId={memoryPacks[0]!.id} initialBoardSize="medium" onStart={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'Medium, 8 pairs' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Small, 6 pairs' })).toHaveAttribute('aria-selected', 'false');
  });

  it('starts with the chosen pack and size', () => {
    const onStart = vi.fn();
    render(<StartScreen packs={memoryPacks} initialPackId={memoryPacks[0]!.id} initialBoardSize="medium" onStart={onStart} />);
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Large, 10 pairs' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(onStart).toHaveBeenCalledWith(memoryPacks[0], 'large');
  });
});
