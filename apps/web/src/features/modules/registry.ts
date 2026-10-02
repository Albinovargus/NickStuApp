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
    description: 'Drag shape cards onto the matching piles.',
    path: '/modules/card-sort',
  },
];
