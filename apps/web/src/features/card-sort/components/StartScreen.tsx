import { useState } from 'react';
import { WrongPlacementModeSchema, type WrongPlacementMode } from '@myapp/types';
import { Button } from '../../../components/ui/button.js';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs.js';
import type { CardPack } from '../configs/packs.js';

export const MODE_LABELS: Record<WrongPlacementMode, string> = {
  accept: 'Count as miss',
  reject: 'Bounce back',
};

const MODE_HELP: Record<WrongPlacementMode, string> = {
  accept: 'Wrong drops stay where they land and count as a miss.',
  reject: 'Wrong drops bounce back until the card is placed correctly.',
};

interface StartScreenProps {
  packs: CardPack[];
  initialPackId: string;
  initialMode: WrongPlacementMode;
  onStart: (pack: CardPack, mode: WrongPlacementMode) => void;
}

export function StartScreen({ packs, initialPackId, initialMode, onStart }: StartScreenProps) {
  const [packId, setPackId] = useState(initialPackId);
  const [mode, setMode] = useState<WrongPlacementMode>(initialMode);
  const pack = packs.find((p) => p.id === packId) ?? packs[0];
  if (!pack) return null;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-8 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Card Sort</h1>
        <p className="text-muted-foreground">
          {pack.instructions} Go as quickly and accurately as you can.
        </p>
      </div>

      <div className="w-full space-y-2">
        <p className="text-sm font-medium">Card pack</p>
        <Tabs value={pack.id} onValueChange={setPackId}>
          <TabsList className="w-full">
            {packs.map((p) => (
              <TabsTrigger key={p.id} value={p.id} className="min-h-11">
                {p.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="w-full space-y-2">
        <p className="text-sm font-medium">Wrong placements</p>
        <Tabs
          value={mode}
          onValueChange={(value) => {
            const parsed = WrongPlacementModeSchema.safeParse(value);
            if (parsed.success) setMode(parsed.data);
          }}
        >
          <TabsList className="w-full">
            {WrongPlacementModeSchema.options.map((m) => (
              <TabsTrigger key={m} value={m} className="min-h-11">
                {MODE_LABELS[m]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <p className="text-xs text-muted-foreground">{MODE_HELP[mode]}</p>
      </div>

      <Button size="lg" className="min-h-11 w-full" onClick={() => onStart(pack, mode)}>
        Start
      </Button>
    </div>
  );
}
