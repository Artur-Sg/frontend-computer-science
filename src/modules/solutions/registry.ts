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
  | 'utf8-strings';

export const solutionLoaders: Record<SolutionKey, () => Promise<SolutionModule>> = {
  encoding: () => import('./encoding/solution'),
  bytecode: () => import('./bytecode/solution'),
  bcd: () => import('./bcd/solution'),
  'bit-ops': () => import('./bit-ops/solution'),
  'pixel-stream': () => import('./pixel-stream/solution'),
  arrays: () => import('./arrays/solution'),
  'utf8-strings': () => import('./utf8-strings/solution')
};
