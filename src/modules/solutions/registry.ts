export type SolutionModule = {
  template: string;
  init?: (root: HTMLElement) => void;
};

export type SolutionKey = 'encoding' | 'bytecode';

export const solutionLoaders: Record<SolutionKey, () => Promise<SolutionModule>> = {
  encoding: () => import('./encoding/solution'),
  bytecode: () => import('./bytecode/solution')
};
