import type { CardSortResult, SortPile } from '@myapp/types';
import { Button } from '../../../components/ui/button.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table.js';
import { computeStats } from '../engine/stats.js';

interface ResultsScreenProps {
  result: CardSortResult;
  piles: SortPile[];
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

export function ResultsScreen({ result, piles, onPlayAgain }: ResultsScreenProps) {
  const stats = computeStats(result, piles);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-4">
      <h1 className="text-center text-2xl font-bold">Results</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="First-try accuracy" value={formatPercent(stats.accuracy)} />
        <Stat label="Total time" value={formatSeconds(stats.durationMs)} />
        <Stat label="Avg per card" value={formatSeconds(stats.avgTimePerCardMs)} />
        <Stat label="Wrong drops" value={String(stats.wrongAttempts)} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pile</TableHead>
            <TableHead className="text-right">Cards</TableHead>
            <TableHead className="text-right">Accuracy</TableHead>
            <TableHead className="text-right">Done at</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stats.piles.map((pile) => (
            <TableRow key={pile.pileId}>
              <TableCell>{pile.label}</TableCell>
              <TableCell className="text-right tabular-nums">{pile.count}</TableCell>
              <TableCell className="text-right tabular-nums">
                {pile.accuracy === null ? '—' : formatPercent(pile.accuracy)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {pile.completedAtMs === null ? '—' : formatSeconds(pile.completedAtMs)}
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
