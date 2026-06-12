export type Assignment = {
  id: string;
  title: string;
  taskPath: string;
  solutionModule:
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
    | 'graph';
};

export const assignments: Assignment[] = [
  {
    id: 'hw-01',
    title: '№1. Кодирование',
    taskPath: 'lectures/01-encoding/homework/homework.md',
    solutionModule: 'encoding'
  },
  {
    id: 'hw-02',
    title: '№2. Интерпретатор байткода',
    taskPath: 'lectures/02-languages/homework/homework.md',
    solutionModule: 'bytecode'
  },
  {
    id: 'hw-03',
    title: '№3. BCD 8421',
    taskPath: 'lectures/03-number-encoding/homework/homework.md',
    solutionModule: 'bcd'
  },
  {
    id: 'hw-04',
    title: '№4. Циклические сдвиги',
    taskPath: 'lectures/04-bit-operations/homework/homework.md',
    solutionModule: 'bit-ops'
  },
  {
    id: 'hw-05',
    title: '№5. RGBA PixelStream',
    taskPath: 'lectures/05-processor-memory/homework/homework.md',
    solutionModule: 'pixel-stream'
  },
  {
    id: 'hw-06',
    title: '№6. Массивы и производительность',
    taskPath: 'lectures/06-arrays/homework/homework.md',
    solutionModule: 'arrays'
  },
  {
    id: 'hw-07',
    title: '№7. UTF-8 сериализация строк',
    taskPath: 'lectures/07-typed-arrays/homework/homework.md',
    solutionModule: 'utf8-strings'
  },
  {
    id: 'hw-08',
    title: '№8. Форматы обмена данными',
    taskPath: 'lectures/08-data-formats/homework/homework.md',
    solutionModule: 'data-formats'
  },
  {
    id: 'hw-09',
    title: '№9. Матрица и вектор',
    taskPath: 'lectures/09-matrix-vector/homework/homework.md',
    solutionModule: 'matrix-vector'
  },
  {
    id: 'hw-10',
    title: '№10. Стек, очередь и дек',
    taskPath: 'lectures/10-stack-queue/homework/homework.md',
    solutionModule: 'stack-queue'
  },
  {
    id: 'hw-11',
    title: '№11. Сегменты памяти программы',
    taskPath: 'lectures/11-memory-segments/homework/homework.md',
    solutionModule: 'memory-manager'
  },
  {
    id: 'hw-12',
    title: '№12. Многозадачность и роль ОС',
    taskPath: 'lectures/12-os-memory/homework/homework.md',
    solutionModule: 'os-memory'
  },
  {
    id: 'hw-15',
    title: '№15. Графы. Способы задания графа',
    taskPath: 'lectures/15-graph/homework/homework.md',
    solutionModule: 'graph'
  }
];
