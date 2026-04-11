import { solutionLoaders } from '#modules/solutions/registry';
import { fetchText } from '#core/services/fetch';
import { renderMarkdown } from '#core/services/markdown';

export type SolutionModule = {
  template: string;
  init?: (root: HTMLElement) => void;
};

export async function loadTaskMarkdown(path: string): Promise<string> {
  const text = await fetchText(path);

  return renderMarkdown(text);
}

export async function loadSolutionMarkdown(taskPath: string): Promise<string> {
  const descriptionPath = taskPath.endsWith('homework.md')
    ? taskPath.replace(/homework\.md$/, 'solution.md')
    : `${taskPath}.solution.md`;

  const text = await fetchText(descriptionPath);

  return renderMarkdown(text);
}

export async function loadSolutionModule(key: string): Promise<SolutionModule> {
  const loader = solutionLoaders[key as keyof typeof solutionLoaders];

  if (!loader) {
    throw new Error(`Нет модуля решения для ${key}`);
  }

  return loader();
}
