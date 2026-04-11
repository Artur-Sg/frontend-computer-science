import type { Assignment } from '#modules/assignments/constants/assignments.data';

export type HashRouter = {
  getInitialAssignment: () => Assignment;
  updateUrl: (id: string) => void;
  start: (onChange: (assignment: Assignment) => void) => void;
  stop: () => void;
};

export function createHashRouter(assignments: Assignment[]): HashRouter {
  let onChangeHandler: ((assignment: Assignment) => void) | null = null;

  const getIdFromUrl = (): string | null => {
    let { hash } = window.location;

    try {
      hash = decodeURIComponent(hash);
    } catch (err) {
      console.warn('Некорректный hash в URL, используется raw значение.', err);
    }

    const normalized = hash.replace('#', '').replace(/\/+$/, '').trim();

    if (normalized) {
      if (/^\d+$/.test(normalized)) {
        const index = Number(normalized) - 1;

        return assignments[index]?.id ?? null;
      }

      return normalized;
    }

    return null;
  };

  const getInitialAssignment = (): Assignment => {
    const id = getIdFromUrl();
    const found = assignments.find((entry) => entry.id === id);

    return found ?? assignments[0];
  };

  const updateUrl = (id: string): void => {
    const index = assignments.findIndex((entry) => entry.id === id);
    const shortId = index >= 0 ? String(index + 1) : id;
    const url = new URL(window.location.href);

    url.hash = shortId;
    window.history.replaceState(null, '', url);
  };

  const handleHashChange = (): void => {
    if (!onChangeHandler) {
      return;
    }
    const id = getIdFromUrl();
    const item = assignments.find((entry) => entry.id === id);

    if (item) {
      onChangeHandler(item);
    }
  };

  const start = (onChange: (assignment: Assignment) => void): void => {
    onChangeHandler = onChange;
    window.addEventListener('hashchange', handleHashChange);
  };

  const stop = (): void => {
    window.removeEventListener('hashchange', handleHashChange);
    onChangeHandler = null;
  };

  return {
    getInitialAssignment,
    updateUrl,
    start,
    stop
  };
}
