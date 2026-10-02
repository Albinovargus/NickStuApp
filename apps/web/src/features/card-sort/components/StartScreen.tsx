import { useState } from 'react';
import { WrongPlacementModeSchema, type WrongPlacementMode } from '@myapp/types';
import { Button } from '../../../components/ui/button.js';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs.js';

const MODE_HELP: Record<WrongPlacementMode, string> = {
  accept: 'Wrong drops stay where they land and count as a miss.',
  reject: 'Wrong drops bounce back until the card is placed correctly.',
};

interface StartScreenProps {
  onStart: (mode: WrongPlacementMode) => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [mode, setMode] = useState<WrongPlacementMode>('accept');

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-8 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Card Sort</h1>
        <p className="text-muted-foreground">
          Drag each card onto the pile with the matching shape. Go as quickly and accurately as you can.
        </p>
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
            <TabsTrigger value="accept" className="min-h-11">Count as miss</TabsTrigger>
            <TabsTrigger value="reject" className="min-h-11">Bounce back</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-xs text-muted-foreground">{MODE_HELP[mode]}</p>
      </div>

      <Button size="lg" className="min-h-11 w-full" onClick={() => onStart(mode)}>
        Start
      </Button>
    </div>
  );
}
