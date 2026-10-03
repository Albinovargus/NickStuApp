export interface TestModule {
  id: string;
  title: string;
  description: string;
  /** Route path (also needs a matching entry in router.tsx). */
  path: string;
}

export const testModules: TestModule[] = [
  {
    id: 'card-sort',
    title: 'Card Sort',
    description: 'Drag cards onto the matching piles: shapes, playing cards or animals.',
    path: '/modules/card-sort',
  },
  {
    id: 'memory-match',
    title: 'Memory Match',
    description: 'Flip cards to find the matching pairs: shapes, playing cards or animals.',
    path: '/modules/memory-match',
  },
];
