export const instructions = {
  'SET A': 0,
  'PRINT A': 1,
  'IFN A': 2,
  'RET': 3,
  'DEC A': 4,
  'JMP': 5,
  'INC A': 6
} as const;

export type InstructionKey = keyof typeof instructions;

export function execute(
  program: number[],
  onPrint?: (value: number) => void
): { out: string[]; returnValue: number | undefined } {
  let pointer = 0;
  let acc = 0;

  const out: string[] = [];
  const print = onPrint || ((v: number) => out.push(String(v)));

  while (pointer < program.length) {
    const operation = program[pointer];

    switch (operation) {
      case instructions['SET A']: {
        const value = program[pointer + 1];

        acc = value;
        pointer += 2;
        break;
      }
      case instructions['PRINT A']: {
        print(acc);
        pointer += 1;
        break;
      }
      case instructions['IFN A']: {
        if (acc === 0) {
          pointer += 1;
        } else {
          pointer += 3;
        }
        break;
      }
      case instructions.RET: {
        const returnValue = program[pointer + 1];

return { out, returnValue };
      }
      case instructions['DEC A']: {
        acc -= 1;
        pointer += 1;
        break;
      }
      case instructions.JMP: {
        const target = program[pointer + 1];

        pointer = target;
        break;
      }
      case instructions['INC A']: {
        acc += 1;
        pointer += 1;
        break;
      }
      default:
        throw new Error(`Неизвестная инструкция: ${operation} на позиции ${pointer}`);
    }
  }

  return { out, returnValue: undefined };
}
