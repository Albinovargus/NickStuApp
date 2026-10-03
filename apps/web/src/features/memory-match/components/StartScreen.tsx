import { useState } from 'react';
import { MemoryBoardSizeSchema, type MemoryBoardSize } from '@myapp/types';
import { Button } from '../../../components/ui/button.js';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs.js';
import { BOARD_SIZES, type MemoryPack } from '../configs/packs.js';

interface StartScreenProps {
  packs: MemoryPack[];
  initialPackId: string;
  initialBoardSize: MemoryBoardSize;
  onStart: (pack: MemoryPack, boardSize: MemoryBoardSize) => void;
}

export function StartScreen({ packs, initialPackId, initialBoardSize, onStart }: StartScreenProps) {
  const [packId, setPackId] = useState(initialPackId);
  const [boardSize, setBoardSize] = useState<MemoryBoardSize>(initialBoardSize);
  const pack = packs.find((p) => p.id === packId) ?? packs[0];
  if (!pack) return null;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-8 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Memory Match</h1>
        <p className="text-muted-foreground">
          {pack.instructions} Use as few turns as you can.
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
        <p className="text-sm font-medium">Board size</p>
        <Tabs
          value={boardSize}
          onValueChange={(value) => {
            const parsed = MemoryBoardSizeSchema.safeParse(value);
            if (parsed.success) setBoardSize(parsed.data);
          }}
        >
          <TabsList className="w-full">
            {MemoryBoardSizeSchema.options.map((size) => (
              <TabsTrigger key={size} value={size} className="min-h-11 flex-col gap-0 leading-tight">
                <span>{BOARD_SIZES[size].label}</span>
                <span className="text-xs font-normal text-muted-foreground">{BOARD_SIZES[size].pairs} pairs</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <Button size="lg" className="min-h-11 w-full" onClick={() => onStart(pack, boardSize)}>
        Start
      </Button>
    </div>
  );
}
