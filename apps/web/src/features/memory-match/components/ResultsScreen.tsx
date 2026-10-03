import { useEffect, useRef } from 'react';
import type { MemoryCard, MemoryMatchResult } from '@myapp/types';
import { Button } from '../../../components/ui/button.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table.js';
import { CardFace, cardFaceLabel } from '../../cards/index.js';
import { computeStats } from '../engine/stats.js';

interface ResultsScreenProps {
  result: MemoryMatchResult;
  cards: MemoryCard[];
  /** e.g. pack name and board size, shown under the heading. */
  subtitle?: string;
  onPlayAgain: () => void;
}

const formatSeconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
const formatPercent = (ratio: number) => `${Math.round(ratio * 100)}%`;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3 text-center">
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function ResultsScreen({ result, cards, subtitle, onPlayAgain }: ResultsScreenProps) {
  const stats = computeStats(result, cards);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-4">
      <div className="text-center">
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold outline-none">
          Results
        </h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Turns" value={String(stats.turns)} />
        <Stat label="Accuracy" value={formatPercent(stats.accuracy)} />
        <Stat label="Total time" value={formatSeconds(stats.durationMs)} />
        <Stat label="Avg per turn" value={formatSeconds(stats.avgTimePerTurnMs)} />
        <Stat label="Memory errors" value={String(stats.memoryErrors)} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pair</TableHead>
            <TableHead className="text-right">Flips</TableHead>
            <TableHead className="text-right">Turn</TableHead>
            <TableHead className="text-right">Found at</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stats.pairStats.map((pair) => (
            <TableRow key={pair.pairId}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div
                    className="relative flex h-14 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-card"
                    aria-hidden
                  >
                    <CardFace card={pair.face} size="sm" />
                  </div>
                  <span>{cardFaceLabel(pair.face)}</span>
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">{pair.flips}</TableCell>
              <TableCell className="text-right tabular-nums">{pair.matchedOnTurn ?? '—'}</TableCell>
              <TableCell className="text-right tabular-nums">
                {pair.matchedAtMs === null ? '—' : formatSeconds(pair.matchedAtMs)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Button size="lg" className="min-h-11 w-full" onClick={onPlayAgain}>
        Play again
      </Button>
    </div>
  );
}
