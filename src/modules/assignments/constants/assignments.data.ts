export type Assignment = {
  id: string;
  title: string;
  taskPath: string;
  solutionModule: 'encoding' | 'bytecode' | 'bcd' | 'bit-ops' | 'pixel-stream';
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
  },
  {
    id: 'hw-03',
    title: 'ДЗ №3. BCD 8421',
    taskPath: 'lectures/03-number-encoding/homework/homework.md',
    solutionModule: 'bcd'
  },
  {
    id: 'hw-04',
    title: 'ДЗ №4. Циклические сдвиги',
    taskPath: 'lectures/04-bit-operations/homework/homework.md',
    solutionModule: 'bit-ops'
  },
  {
    id: 'hw-05',
    title: 'ДЗ №5. RGBA PixelStream',
    taskPath: 'lectures/05-processor-memory/homework/homework.md',
    solutionModule: 'pixel-stream'
  }
];
