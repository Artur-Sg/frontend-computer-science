export type Assignment = {
  id: string;
  title: string;
  taskPath: string;
  solutionModule: 'encoding' | 'bytecode';
};

export const assignments: Assignment[] = [
  {
    id: 'hw-01',
    title: 'ДЗ №1. Кодирование',
    taskPath: 'lectures/01-encoding/homework/homework.md',
    solutionModule: 'encoding'
  },
  {
    id: 'hw-02',
    title: 'ДЗ №2. Интерпретатор байткода',
    taskPath: 'lectures/02-languages/homework/homework.md',
    solutionModule: 'bytecode'
  }
];
