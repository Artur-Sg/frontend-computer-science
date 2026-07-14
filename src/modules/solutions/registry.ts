export type SolutionModule = {
  template: string;
  init?: (root: HTMLElement) => void;
};

export type SolutionKey =
  | 'encoding'
  | 'bytecode'
  | 'bcd'
  | 'bit-ops'
  | 'pixel-stream'
  | 'arrays'
  | 'utf8-strings'
  | 'data-formats'
  | 'matrix-vector'
  | 'stack-queue'
  | 'memory-manager'
  | 'os-memory'
  | 'hash-table'
  | 'sorting-search'
  | 'graph'
  | 'regular-expressions'
  | 'advanced-regular-expressions';

export const solutionLoaders: Record<SolutionKey, () => Promise<SolutionModule>> = {
  encoding: () => import('./encoding/solution'),
  bytecode: () => import('./bytecode/solution'),
  bcd: () => import('./bcd/solution'),
  'bit-ops': () => import('./bit-ops/solution'),
  'pixel-stream': () => import('./pixel-stream/solution'),
  arrays: () => import('./arrays/solution'),
  'utf8-strings': () => import('./utf8-strings/solution'),
  'data-formats': () => import('./data-formats/solution'),
  'matrix-vector': () => import('./matrix-vector/solution'),
  'stack-queue': () => import('./stack-queue/solution'),
  'memory-manager': () => import('./memory-manager/solution'),
  'os-memory': () => import('./os-memory/solution'),
  'hash-table': () => import('./hash-table/solution'),
  'sorting-search': () => import('./sorting-search/solution'),
  'graph': () => import('./graph/solution'),
  'regular-expressions': () => import('./regular-expressions/solution'),
  'advanced-regular-expressions': () => import('./advanced-regular-expressions/solution')
};
