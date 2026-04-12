type AssignmentSlots = {
  taskEl: HTMLDivElement;
  solutionTldrEl: HTMLDivElement;
  solutionDescriptionEl: HTMLDivElement;
  solutionEl: HTMLDivElement;
};

export function createAssignmentSlots(): AssignmentSlots {
  const taskEl = document.createElement('div');

  taskEl.className = 'content';
  taskEl.slot = 'task';
  taskEl.textContent = 'Загрузка...';

  const solutionDescriptionEl = document.createElement('div');

  solutionDescriptionEl.className = 'content';
  solutionDescriptionEl.slot = 'solution-description';
  solutionDescriptionEl.textContent = 'Загрузка...';

  const solutionTldrEl = document.createElement('div');

  solutionTldrEl.className = 'content';
  solutionTldrEl.slot = 'solution-tldr';

  const solutionEl = document.createElement('div');

  solutionEl.className = 'content';
  solutionEl.slot = 'solution';
  solutionEl.textContent = 'Загрузка...';

  return { taskEl, solutionTldrEl, solutionDescriptionEl, solutionEl };
}

export type { AssignmentSlots };
