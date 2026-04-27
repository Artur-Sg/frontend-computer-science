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
    | 'utf8-strings';
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
  },
  {
    id: 'hw-06',
    title: 'ДЗ №6. Массивы и производительность',
    taskPath: 'lectures/06-arrays/homework/homework.md',
    solutionModule: 'arrays'
  },
  {
    id: 'hw-07',
    title: 'ДЗ №7. UTF-8 сериализация строк',
    taskPath: 'lectures/07-typed-arrays/homework/homework.md',
    solutionModule: 'utf8-strings'
  }
];
